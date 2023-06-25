import React from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';

import { Navbar, Nav, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { LogoutButton, LoginButton } from './Auth';
import Example from './Canvas';import FlagOfItalyImage from '../img/Flag_of_Italy.svg.png'; // Import the image file

const Navigation = (props) => {

  return (
<Navbar expand="sm" variant="dark" fixed="top" className="navbar-padding" style={{ backgroundImage: `url(${FlagOfItalyImage})`, backgroundSize: 'cover' }}>
  <Link to="/" style={{ textDecoration: 'none' }}>
    <Navbar.Brand>
      {props.getName}
    </Navbar.Brand>
  </Link>
  <Navbar.Toggle aria-controls="navbar-nav" />
  <Navbar.Collapse id="navbar-nav">
    <Nav className="col-md-10 justify-content-end">
      <Navbar.Text className="mx-2">
        {props.user.user && props.user.user.username && `Welcome ${props.user.user.role ? 'admin' : 'user'}, ${props.user.user.username}!`}
      </Navbar.Text>
      <Form className="mx-2">
        {props.user.loggedIn ? <LogoutButton logout={props.logout} /> : <LoginButton />}
      </Form>
    </Nav>
  </Navbar.Collapse>
</Navbar>
  );
}

export { Navigation };
