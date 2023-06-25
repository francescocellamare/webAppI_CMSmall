import { useState } from "react"
import { Button, Container, Table } from "react-bootstrap"
import { Row } from "react-bootstrap"


function PageTable(props) {
    const pages = props.pages
    return <>  
    <Table striped>
      <thead>
        <tr>
          <th>Id</th>
          <th>Title</th>
          <th>Date (MM/DD/YYYY)</th>
          <th>Username</th>
        </tr>
      </thead>
      <tbody>
        { pages.map( page => <PageRow pageHandle={props.pageHandle} user={props.user} setOpen={props.setOpen} key={page.id} data={page}/> ) }
      </tbody>
    </Table>
    </>
}

function PageRow(props) {
    const page = props.data
    return (
    <tr>
        <td> {page.id} </td>
        <td> {page.title} </td>
        <td>
          {page.publishDate.isValid() && page.publishDate.format('MM-DD-YYYY')} 

          {!page.publishDate.isValid() && ''} 
        </td>
        <td> {page.username} </td>
        <td> 
          <Button className="mt-3 btn-success" onClick={() => {props.setOpen(page.id)}}>Show</Button>
          &nbsp;
          {props.user.loggedIn && (props.user.admin || props.user.user.username === page.username) && <Button className="mt-3 btn-light" onClick={() => {props.pageHandle.editPage(page.id)}}>Edit</Button> }
          &nbsp;
          {props.user.loggedIn && (props.user.admin || props.user.user.username === page.username) && <Button className="mt-3 btn-danger" onClick={() => {props.pageHandle.deletePage(page.id)}}>Delete</Button> }
        </td>
    </tr>
    )
}

function PageBlock(props) {
  
  const blocks = props.blocks
  return <>
  <Row>
    { blocks.length !== 0 && <p>  by {blocks[0].username} </p> }
    { blocks.sort((a,b) => a.rank - b.rank).map(block => <BlockRow key={block.id} data={block}/>) } 
  </Row>
  </>
}

function BlockRow(props) {
  const data = props.data
  if(data.type === 'header')
    return <>
      <h3> {data.content} </h3>
    </>
  else if(data.type === 'paragraph')
    return <>
    <div>
      <p> {data.content} </p>
    </div>
    </>
  else if(data.type === 'image') {
  
    return <>
      <img src={'../img/' + data.content} alt="missing image" width="100%" height="50%"/>
    </>
  }
}
export { PageTable, PageBlock }