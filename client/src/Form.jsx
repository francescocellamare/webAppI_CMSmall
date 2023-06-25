import dayjs from 'dayjs';

import {useEffect, useState} from 'react';
import {Form, Button, Row, Col} from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import API from './API';

const EditBlockForm = (props) => {
  const [currentBlock, setCurrentBlock] = useState(-1)
  const [content, setContent] = useState('')
  const [type, setType] = useState('header')

  const [enable, setEnable] = useState(true)

  useEffect( () => {
    setContent('')
  }, [type])
  function handleDelete(pageid, current) {
    if(currentBlock === -1) return 
    props.deleteBlock(pageid, current)
    setCurrentBlock(-1)
  }

  function handleAdd(pageid) {
    const block = {
      type: type,
      content: content,
      rank: Math.max(...props.blocks.map( block => block.rank))+1
    }
    props.addBlock(pageid, block)
  }
  return <>
    <Form className="block-example border border rounded mb-0 form-padding">
      <Form.Group className="mb-3">
        <Form.Label>Block</Form.Label>
        <Form.Select required={true} value={currentBlock} onChange={event => setCurrentBlock(event.target.value)}>
          {props.blocks.map( block => <option id={block.id} value={block.id}> {block.id} {block.type} - {block.content} </option>)}
        </Form.Select>
        {
          type !== 'image' && <>
          <Form.Label>Content</Form.Label>
          <Form.Control type="text" value={content} onChange={event => setContent(event.target.value) }/>
          </>
        }
        {
          type === 'image' && <>
          <Form.Label>Content</Form.Label>
          <Form.Select required={true} value={content} onChange={event => setContent(event.target.value)}>
            <option id='1' value="img1.jpeg">img1</option>
            <option id='2' value="img2.jpeg">img2</option>
            <option id='3' value="img3.jpeg">img3</option>
            <option id='4' value="img4.jpeg">img4</option>
          </Form.Select>
          </>
        }

        <Form.Label>Type (use the content block)</Form.Label>
        <Form.Select required={true} value={type} onChange={event => setType(event.target.value)}>
            <option id='1' value="header">header</option>
            <option id='2' value="paragraph">paragraph</option>
            <option id='3' value="image">image</option>
        </Form.Select>
        <Button className="mb-3" variant="success" onClick={() => handleAdd(props.blocks[0].pageId)}> Add </Button>
        &nbsp;
        <Button className="mb-3" variant="danger" onClick={() => props.editBlock(content, props.blocks[0].pageId, currentBlock)}> Edit </Button>
        &nbsp;
        <Button className="mb-3" variant="danger" onClick={() => {handleDelete(props.blocks[0].pageId, currentBlock)} }> Delete </Button>
        &nbsp;
        <Button disabled={!enable} className="mb-3" variant="info" onClick={() => {props.moveBlock(props.blocks[0].pageId, currentBlock, 'up'); setEnable(false); setTimeout(() => setEnable(true), 500)}}> Up </Button>
        &nbsp;
        <Button disabled={!enable} className="mb-3" variant="info" onClick={() => {props.moveBlock(props.blocks[0].pageId, currentBlock, 'down'); ; setEnable(false); setTimeout(() => setEnable(true), 500)} }> Down </Button>

      </Form.Group> 
    </Form>
  </>

}


const AddPageForm = (props) => {

  const [title, setTitle] = useState( props.editedPage !== undefined ? props.editedPage.page.title : '');
  const [date, setDate] = useState('');
  const [username, setUsername] = useState(props.editedPage !== undefined ? props.editedPage.page.username : '')

  const [type, setType] = useState('header')
  const [content, setContent] = useState('')

  const [blocks, setBlocks] = useState([])
  const [added, setAdded] = useState(0)
  const [selectedBlock, setSelectedBlock] = useState(-1)

  const [users, setUsers] = useState([])

  const disable = props.user.admin === false ? true : false

  
  useEffect( () => {
    const loadUser = async () => {
      const users = await API.getUsers()
      setUsers(users)
    }

    const loadBlocks = async () => {
      const blocks = await API.listPrivateBlocks(props.editedPage.page.id)
      setSelectedBlock(blocks[0].blockid)
      setBlocks(blocks)
    }

    if(!disable)
      loadUser()

    if(props.phase === 2)
      loadBlocks()
    
  }, [])

  const handleSubmit = () => {
    const page = {
      title: title,
      publishDate: date !== '' ? dayjs(date).format('MM/DD/YYYY') : ' ',
      username: username
    }
    if(props.phase === 2) {
      page.id = props.editedPage.page.id
      props.editPage(page)
    }
    else if(props.phase === 1) {
      props.addPage(page, blocks)
    }
    props.moveTo.setView()
  }

  const handleAddBlock = () => {
    const block = {
      id: added,
      type: type,
      content: content,
      rank: blocks[blocks.length-1] != undefined ? blocks[blocks.length-1].rank+1 : 1
    }
    setAdded( added+1 )
    setBlocks([...blocks, block])
    setContent('')
    setType('header')
  }

  const deleteLocalBlock = (id) => {
    const newblocks = blocks.map( block => {
      if(block.id >= id) {
        block.rank = block.rank-1
      }
      return block
    }).filter( block => block.id !== id)
    setBlocks(newblocks)
  } 

  const moveUpOrDown = (id, up) => {
    const rank = blocks.filter( block => block.id === id)[0].rank
    if(up) {
      const idToSwap = blocks.filter(block => block.rank === rank-1)[0].id
      const newblocks = blocks.map( block => {
        if(block.id === idToSwap) {
          block.rank = rank
        }
        if(block.id === id) {
          block.rank = rank-1
        }
        return block
      })
      setBlocks(newblocks)
    }
    else {
      const idToSwap = blocks.filter(block => block.rank === rank+1)[0].id
      const newblocks = blocks.map( block => {
        if(block.id === idToSwap) {
          block.rank = rank
        }
        if(block.id === id) {
          block.rank = rank+1
        }
        return block
      })
      setBlocks(newblocks)
    }
  }
  return (
    <Form className="block-example border border rounded mb-0 form-padding">
      <Form.Group className="mb-3">
        <Form.Label>Title</Form.Label>
        <Form.Control type="text" required={true} placeholder={title} onChange={event => setTitle(event.target.value)}/>
        
        <Form.Label>Date</Form.Label>
        <Form.Control type="date" value={date} onChange={event => setDate(event.target.value) }/>
        
        {
          props.phase === 2 && <Form.Label>Username</Form.Label>
        }
          
        {
          props.phase === 2 && 
          <Form.Select disabled={disable} required={true} value={username} onChange={event => setUsername(event.target.value)}>
            { users.map( user => <option id={user.username} value={user.username}> {user.username} </option>) }
          </Form.Select>
        }
      </Form.Group>
      { 
        props.phase === 1 && <Form.Group className="block-example border border rounded mb-0 form-padding">
          <Form.Select required={true} value={type} onChange={event => setType(event.target.value)}>
            <option value="header">header</option>
            <option value="paragraph">paragraph</option>
            <option value="image">image</option>
          </Form.Select>
          {
            type !== 'image' && <>
              <Form.Label>Content</Form.Label>
              <Form.Control type="text" required={true} value={content} onChange={event => setContent(event.target.value) }/>
            </> 
          }
          {
            type === 'image' && <>
              <Form.Label>Content</Form.Label>
              <Form.Select required={true} value={content} onChange={event => setContent(event.target.value)}>
                <option value="img1.jpeg">1</option>
                <option value="img2.jpeg">2</option>
                <option value="img3.jpeg">3</option>
                <option value="img4.jpeg">4</option>
              </Form.Select>
            </>
          }
          <br/>
          <Button className="mb-3" variant="success" onClick={ () => handleAddBlock()}> Add </Button>
        </Form.Group> 
      }
      <Button className="mb-3" variant="success" onClick={ () => handleSubmit()}> Save </Button>
      &nbsp;
      <Button className="btn btn-danger mb-3" onClick={ () => props.moveTo.setView() }> Cancel </Button>
    
      { props.phase === 1 && blocks.map( block => <BlockRow delete={deleteLocalBlock} move={moveUpOrDown} block={block} key={block.added}/> ) }
    </Form>

  )

}

function BlockRow(props) {
  return <>
    <Row> 
      <Col>
      {props.block.type + ' '}: 
        {props.block.type !== 'image' && (props.block.content + ' ' + props.block.id + ' at position ' + ' ' + props.block.rank) }
        {props.block.type === 'image' && <> <ImageToShow name={props.block.content}/> {' at position '} {props.block.rank}</> }
      </Col>
      <Col>
      <Button className="btn btn-danger mb-3" onClick={() => props.delete(props.block.id)}>Delete</Button>
      &nbsp;
      <Button className="btn btn-info mb-3" onClick={() => props.move(props.block.id, 1)}>Up</Button>
      &nbsp;
      <Button className="btn btn-info mb-3" onClick={() => props.move(props.block.id, 0)}>Down</Button>
      </Col>
    </Row>
  </>
}

function ImageToShow(props) {
  const path = '../img/' + props.name
  return <>
    <img src={path} width="80rem" height="40rem"/>
  </>
}
export { AddPageForm, EditBlockForm };
