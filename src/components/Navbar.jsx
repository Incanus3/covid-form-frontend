import * as _ from 'lodash';

import { useContext             } from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { withRouter             } from 'react-router';
import { Route                  } from 'react-router-dom';
import { LinkContainer          } from 'react-router-bootstrap';
import { BsChevronCompactRight  } from "react-icons/bs";

import { AuthContext } from 'src/auth'

function NavLink({ to, label, active, exact = false }) {
  return (
    // eslint-disable-next-line react/no-children-prop
    <Route path={to} children={({ match }) => (
      <LinkContainer to={to} exact={exact}>
        <Nav.Link active={active === undefined ? !!match : active}>{label}</Nav.Link>
      </LinkContainer>
    )}/>
  )
}

function CovidNavbar({ location, history }) {
  const auth        = useContext(AuthContext)
  const isAdminPage = _.startsWith(location.pathname, '/admin')

  return (
    <Navbar variant="dark" bg="dark" expand="sm">
      <Container>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />

        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mr-auto">
            <LinkContainer to="/" exact={true}>
              <Nav.Link id="registration-link">Registrace</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/admin">
              <Nav.Link id="administration-link" active={isAdminPage}>Administrace</Nav.Link>
            </LinkContainer>
            {isAdminPage &&
              <>
                <Navbar.Text><BsChevronCompactRight /></Navbar.Text>
                <NavLink id="export-link" label='CSV export' to='/admin/export'/>
              </>}
          </Nav>

          {isAdminPage &&
            <Nav>
              {auth.isLoggedIn ?
                <Nav.Link id="logout-link" onClick={() => auth.logOut(history)}>
                  Odhlásit se
                </Nav.Link> :
                <LinkContainer to={'/admin/login'}>
                  <Nav.Link id="login-link">Přihlásit se</Nav.Link>
                </LinkContainer>}
            </Nav>}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}

export default withRouter(CovidNavbar);