import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';

import { useState, useEffect } from 'react';
import { Button, Col, Container, Row, Toast } from 'react-bootstrap';
import { Navigation } from './Navigation';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { LoginLayout } from './LoginLayout';
import { Homepage, DefaulLayout } from './PageLayout';
import API from './API.js'


import MessageContext from './message';

function App() {

  const [dirty, setDirty] = useState(false);

  const [loggedIn, setLoggedIn] = useState(false);

  const [user, setUser] = useState(null);

  const [webname, setWebname] = useState('')

  const [publicPages, setPublicPages] = useState([])

  const [open, setOpen] = useState(-1)

  const [publicBlocks, setPublicBlocks] = useState([])

  const [admin, setAdmin] = useState(false)

  const [editedPage, setEditedPage] = useState(null)

  const [loading, setLoading] = useState(false)

  const [office, setOffice] = useState(false)

  const [message, setMessage] = useState('');

  /**
   * 0 show
   * 1 add
   * 2 edit
   */
  const [phase, setPhase] = useState(0)

  const handleErrors = (err) => {
    let msg = '';
    if (err.error) msg = err.error;
    else if (String(err) === "string") msg = String(err);
    else msg = "Unknown Error";
    setMessage(msg); // WARN: a more complex application requires a queue of messages. In this example only last error is shown.
  }

  function setView() {
    setPhase(0)
    setEditedPage(null)
  }

  function setAdd() {
    setPhase(1)
    setEditedPage(null)
  }

  function setEdit() {
    setPhase(2)
  }

  const moveTo = {
    phase: phase,
    setAdd: setAdd,
    setEdit: setEdit,
    setView: setView
  }

  const handleLogin = async (credentials) => {
    try {
      const user = await API.login(credentials);
      setUser(user)
      setLoggedIn(true)
      setOffice(true)
      if (user.role)
        setAdmin(true)
      const ppages = await API.getCreatedPages()

      setPublicPages(ppages)
    } catch (err) {

      handleErrors(err)
    }
  };

  const handleLogout = async () => {
    await API.logout()
    setUser(null)
    setLoggedIn(false)
    setAdmin(false)
    setPublicBlocks([])
    setView()
    setDirty(true)
    setOpen(-1)
  };

  const handleChangeName = async (name) => {
    try {
      await API.updateWebName(name)
      setWebname(name)
      setView()
      setDirty(true)
    }
    catch (err) {
      handleErrors(err)
    }
  }

  async function getName() {
    try{
      const name = await API.getWebName()
      setWebname(name)
    }
    catch (err) {
      handleErrors(err)
    }
  }

  async function getPublicPages() {
    try{
      const pages = await API.getPublishedPages()
      const ordPages = pages.filter( page => page.publishDate.isValid()).sort( (a,b) => {
        return a.publishDate.isBefore(b.publishDate) ? 1 : -1
      })
      const other = pages.filter( page => page.publishDate.isValid() ? false : true)
      ordPages.push(...other)

      setPublicPages(ordPages)
    }
    catch(err) {
      handleErrors(err)
    }
  }

  async function getBlocks() {
    try{
      let blocks = []
      if (loggedIn)
        blocks = await API.listPrivateBlocks(open)
      else
        blocks = await API.listPublicBlocks(open)
      setPublicBlocks(blocks)
    }
    catch(err) {
      handleErrors(err)
    }
  }

  useEffect(() => {
    const loadPage = async () => {
        await getBlocks()
    }
    if (open != -1)
      loadPage()
  }, [open])

  useEffect(() => {
    const loadPage = async () => {
      try{
        const res = office ? await API.getCreatedPages() : await API.getPublishedPages()
        const ordPages = res.filter( page => page.publishDate.isValid()).sort( (a,b) => {
          return a.publishDate.isBefore(b.publishDate) ? 1 : -1
        })
        if(office) {
          const other = res.filter( page => page.publishDate.isValid() ? false : true)
          ordPages.push(...other)
        }
        setPublicPages(ordPages)
      }
      catch(err) {
        handleErrors(err)
      }
    }

    loadPage()
  }, [office])

  useEffect(() => {
    const init = async () => {
      await getName()
      await getPublicPages()
      try {
        const user = await API.stillLoggedIn()
        setUser(user);
        if (user.role)
          setAdmin(true)
        setLoggedIn(true);
      } catch (err) {
        handleErrors(err)
        setUser(null);
        setAdmin(false)
        setLoggedIn(false);
      }
    };
    setLoading(true)
    init();
    setLoading(false)
  }, []);


  useEffect(() => {
    const update = async () => {
      try {
        if (loggedIn) {
          const res = await API.getCreatedPages()
          if (open !== -1) {
            const resBlocks = await API.listPrivateBlocks(open)
            setPublicBlocks(resBlocks)
          }
          const ordPages = res.filter( page => page.publishDate.isValid()).sort( (a,b) => {
            return a.publishDate.isBefore(b.publishDate) ? 1 : -1
          })
          const other = res.filter( page => page.publishDate.isValid() ? false : true)
          ordPages.push(...other)
          setPublicPages(ordPages)
        }
        else {
          const res = await API.getPublishedPages()
          if (open !== -1) {
            const resBlocks = await API.listPublicBlocks(open)
            setPublicBlocks(resBlocks)
          }

          const ordPages = res.filter( page => page.publishDate.isValid()).sort( (a,b) => {
            return a.publishDate.isBefore(b.publishDate) ? 1 : -1
          })
          setPublicPages(ordPages)
        }

        setLoading(false)
      }
      catch(err) {
        handleErrors(err)
      }
    }

    setLoading(true)
    if (dirty)
      update()

    setDirty(false)

    setLoading(false)

  }, [dirty]);

  async function handleDeletePage(id) {
    try {
      const res = await API.deletePage(id)
      setDirty(true)
    }
    catch(err) {
      handleErrors(err)
    }
  }

  async function handleEditPage(id) {
    try {
      let blocks = []
      if (loggedIn)
        blocks = await API.listPrivateBlocks(id)
      else
        blocks = await API.listPublicBlocks(id)
  
      const page = publicPages.filter(page => page.id === id)
  
      const wholePage = {
        page: page[0],
        blocks: blocks
      }
  
      setEditedPage(wholePage)
      setEdit()
      return wholePage
    }
    catch(err) {
      handleErrors(err)
    }
  }

  async function editPage(page) {
    try { 
      await API.editPage(page.id, page)
      setDirty(true)
    }
    catch(err) {
      handleErrors(err)
    }
  }

  async function editBlock(content, pageid, blockid) {
    try { 
      await API.updateBlock(content, pageid, blockid)
      setDirty(true)
    }
    catch(err) {
      handleErrors(err)
    }
  }

  async function deleteBlock(pageid, blockid) {
    try {
      await API.deleteBlock(pageid, blockid)
      setDirty(true)
    }
    catch(err) {
      handleErrors(err)
    }
  }

  async function moveBlock(pageid, blockid, up) {
    try {
      await API.moveBlock(pageid, blockid, up)
      setDirty(true)
    }
    catch(err) {
      handleErrors(err)
    }
  }

  async function addPage(page, blocks) {
    try {
      await API.createPage(page, blocks)
      setDirty(true)
    }
    catch(err) {
      handleErrors(err)
    }
  }

  async function addBlock(pageid, block) {
    try{
      await API.addBlock(pageid, block)
      setDirty(true)
    }
    catch(err) {
      handleErrors(err)
    }
  }

  const user_states = {
    user: user,
    setUser: setUser,
    loggedIn: loggedIn,
    setLoggedIn: setLoggedIn,
    admin: admin,
    setAdmin: setAdmin
  }

  const site_info = {
    webname: webname,
    setWebname: setWebname
  }

  const crud_page = {
    deletePage: handleDeletePage,
    editPage: handleEditPage

  }

  return <>
    <BrowserRouter>
      <MessageContext.Provider value={{ handleErrors }}>
        <Container flex className="App below-nav containerBody">

          <Navigation logout={handleLogout} user={user_states} getName={webname} />

          <Routes>
            <Route path='/' element={<DefaulLayout user={user_states} open={open} setOpen={setOpen} blocks={publicBlocks} addBlock={addBlock} editBlock={editBlock} deleteBlock={deleteBlock} moveBlock={moveBlock} />}>
              <Route path='/' element={<Homepage office={office} setOffice={setOffice} moveTo={moveTo} addPage={addPage} editPage={editPage} editedPage={editedPage} phase={phase} pageHandle={crud_page} site={site_info} handleChangeName={handleChangeName} user={user_states} dirty={dirty} setDirty={setDirty} pages={publicPages} ppages={publicPages} open={open} setOpen={setOpen} blocks={publicBlocks} />} />
            </Route>
            <Route path='/login' element={<LoginLayout login={handleLogin} />} />
          </Routes>

          <Toast show={message !== ''} onClose={() => setMessage('')} delay={4000} autohide bg="danger">
            <Toast.Body>{message}</Toast.Body>
          </Toast>
        </Container>

      </MessageContext.Provider>
    </BrowserRouter>
  </>

}

export default App
