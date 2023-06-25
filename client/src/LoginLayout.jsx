import { Row, Col } from "react-bootstrap";
import { LoginForm } from "./Auth";

function LoginLayout(props) {
    return (
      <Row className="vh-100">
        <Col md={12} className="below-nav">
          <LoginForm login={props.login} />
        </Col>
      </Row>
    );
  }

export { LoginLayout }