import { Outlet } from "react-router-dom"
import { PageTable, PageBlock } from "./Page"
import { LoginButton } from "./Auth"
import { Button, Container, Toast } from "react-bootstrap"
import { Row, Col } from "react-bootstrap"
import Example from "./Canvas"
import {  AddPageForm, EditBlockForm } from "./Form"
import { useState } from "react"

function Homepage(props) {
    return <>
    <Row>
        { props.phase === 0 && props.user.loggedIn && props.user.admin ? <Example user={props.user} site={props.site} handleChangeName={props.handleChangeName}/> : <></> }
        { props.phase === 0 && props.user.loggedIn && <Button className="mt-3 btn-danger" onClick={() => {props.moveTo.setAdd()}}>Add a page</Button>}
        { props.phase === 0 && props.user.loggedIn && <Button className="mt-3 btn-success" onClick={() => {props.setOffice(!props.office)}}> {props.office ? 'BackOffice' : "FrontOffice"} </Button>}
    </Row>
    <Row>
        { props.phase === 0 && !props.user.loggedIn && <PageTable pageHandle={props.pageHandle} user={props.user} setOpen={props.setOpen} pages={props.pages}/> }
        { props.phase === 0 && props.user.loggedIn && props.office && <PageTable pageHandle={props.pageHandle} user={props.user} setOpen={props.setOpen} pages={props.ppages}/> }
        { props.phase === 0 && props.user.loggedIn && !props.office && <PageTable pageHandle={props.pageHandle} user={props.user} setOpen={props.setOpen} pages={props.pages}/> }
        { props.phase === 1 && props.user.loggedIn && <AddPageForm moveTo={props.moveTo} user={props.user} addPage={props.addPage} phase={props.phase}/> }
        { props.phase === 2 && props.user.loggedIn && <AddPageForm moveTo={props.moveTo} user={props.user} editPage={props.editPage} editedPage={props.editedPage} phase={props.phase}/> }
    </Row>
    </>
}

function DefaulLayout(props) {
    const [showedit, setShowedit] = useState(false)
    return (
        <Row className="vh-100">
          <Col md={8} xl={7} id="left-sidebar">
            <Outlet/>
          </Col>
          <Col md={4} xl={5} id="right-sidebar">
            <Row>
              <Col>
            { (props.open != -1) && <PageBlock blocks={props.blocks}/> }
              </Col>
            { !showedit && (props.open != -1) && props.user.loggedIn && props.user && props.blocks[0] && (props.user.admin || props.user.user.username === props.blocks[0].username) && <Button className="mt-3 btn-danger" onClick={() => setShowedit(true)}>Edit</Button>}
            { showedit && (props.open != -1) && props.user.loggedIn && props.user && props.blocks[0] && (props.user.admin || props.user.user.username === props.blocks[0].username) && <Button className="mt-3 btn-danger" onClick={() => setShowedit(false)}>Close</Button>}
            </Row>
            <Row>
              <Col>
              { showedit && (props.open != -1) && props.user.loggedIn && <EditBlockForm addBlock={props.addBlock} editBlock={props.editBlock} deleteBlock={props.deleteBlock} moveBlock={props.moveBlock} blocks={props.blocks}/> }
              </Col>
            </Row>
          </Col>
        </Row>
      );
}

export {Homepage, DefaulLayout}