
import { Navbar, Nav, Container,NavDropdown, Badge  } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useAdminLogoutMutation } from '../adminSlice/AdminApiSlice.js';
import { adminLogout } from '../adminSlice/AdminAuthSlice.js';
import { FaSignInAlt, FaSignOutAlt,FaGoogle } from 'react-icons/fa';



const Header = () => {
  const { adminInfo } = useSelector((state) => state.adminAuth);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [logoutApi] = useAdminLogoutMutation();
  
  const logoutHandler = async () => {
    try {
      await logoutApi().unwrap();
      dispatch(adminLogout());
      navigate('/admin/login');
    } catch (err) {
      console.error(err);
    }
  };


  
  

  return (
    <header>
    <Navbar style={{ backgroundColor: '#055049' }} variant='dark' expand='lg' collapseOnSelect className='custom-navbar'>
      <Container>
        <LinkContainer to='/'>
          <Navbar.Brand className='navbar-brand-custom'>TRAVE<span style={{color:"#e8f32b"}}>LISTA</span></Navbar.Brand>
        </LinkContainer>
          <Navbar.Toggle aria-controls='basic-navbar-nav' />
          <Navbar.Collapse id='basic-navbar-nav'>
            <Nav className='ms-auto'>
              {adminInfo ? (
                <>
                  {/* <NavDropdown title={adminInfo.name} id='username'>
                    <LinkContainer to='/profile'>
                      <NavDropdown.Item>Profile</NavDropdown.Item>
                    </LinkContainer>
                    <NavDropdown.Item onClick={logoutHandler}>Logout</NavDropdown.Item>
                  </NavDropdown> */}

<Nav.Link onClick={()=>navigate('/admin/adminHome')} style={{ fontFamily: "Sora", fontSize: "0.9rem", marginLeft: "0.2rem", marginTop: "0.2rem", color: "#e6e1e1" }}>
      Home 
    </Nav.Link>


    <Nav.Link onClick={()=>navigate('/admin/adminChart')} style={{ fontFamily: "Sora", fontSize: "0.9rem", marginLeft: "0.2rem", marginTop: "0.2rem", color: "#e6e1e1" }}>
      Chart 
    </Nav.Link>


<Nav.Link onClick={()=>navigate('/admin/adminReportList')} style={{ fontFamily: "Sora", fontSize: "0.9rem", marginLeft: "0.2rem", marginTop: "0.2rem", color: "#e6e1e1" }}>
      Report 
    </Nav.Link>

<Nav.Link onClick={()=>navigate('/admin/adminBanner')} style={{ fontFamily: "Sora", fontSize: "0.9rem", marginLeft: "0.2rem", marginTop: "0.2rem", color: "#e6e1e1" }}>
      Banner
    </Nav.Link>

    <Nav.Link onClick={logoutHandler} style={{ fontFamily: "Sora", fontSize: "0.9rem", marginLeft: "0.2rem", marginTop: "0.2rem", color: "#e6e1e1" }}>
      Logout
    </Nav.Link>
                </>
              ) : (
                <>
                  {/* <LinkContainer to='/admin/login'>
                    <Nav.Link>
                    <FaGoogle /> Sign In 
                    </Nav.Link>
                  </LinkContainer>
                  <LinkContainer to='/admin/register'>
                    <Nav.Link>
                    <FaGoogle /> Sign Up
                    </Nav.Link>
                  </LinkContainer> */}
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
};

export default Header;