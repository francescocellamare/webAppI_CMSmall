import { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Offcanvas from 'react-bootstrap/Offcanvas';
import API from './API';
import { Form } from 'react-bootstrap';

function Example(props) {
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const [name, setName] = useState('')
  const handleShow = () => setShow(true);

  async function handleSubmit(event) {
    event.preventDefault();
    props.handleChangeName(name)
      .then( handleClose() )
  }

  return (
    <>
      <Button variant="success" onClick={handleShow}>
        Manage
      </Button>

      <Offcanvas show={show} onHide={handleClose}>
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>You are an {props.user.admin ? 'admin' : 'user'}</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          { 
          props.user.admin && <Form>
              <Form.Group className="mb-3" controlId="text">
                <Form.Label>Website name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder={'website name'}
                  onChange={(ev) => setName(ev.target.value)}
                  required={true}
                />
              </Form.Group>
              <Button className="mt-3 btn-danger" onClick={handleSubmit}>Update name</Button>
          </Form> 
          }

        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}

export default Example;