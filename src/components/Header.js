import React from 'react';
import styled from 'styled-components';

const HeaderContainer = styled.header`
  background-color: #1a2a44;
  color: white;
  padding: 10px 0;
  border-bottom: 4px solid #f4c430;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
`;

const Logo = styled.div`
  img {
    height: 60px;
  }
`;

const NavMenu = styled.nav`
  ul {
    list-style: none;
    display: flex;

    @media (max-width: 768px) {
      flex-direction: column;
      margin-top: 10px;
    }
  }

  li {
    margin-left: 20px;

    @media (max-width: 768px) {
      margin: 10px 0;
    }
  }

  a {
    color: white;
    text-decoration: none;
    font-size: 16px;
    padding: 10px;
    &:hover {
      background-color: #f4c430;
      color: #1a2a44;
      border-radius: 4px;
    }
  }
`;

const Header = () => {
  return (
    <HeaderContainer>
      <Container>
        <Logo>
          <img
            src="https://mof.go.th/themes/custom/mof/logo.png"
            alt="Ministry of Finance Logo"
          />
        </Logo>
        <NavMenu>
          <ul>
            <li><a href="#">หน้าหลัก</a></li>
            <li><a href="#">เกี่ยวกับหน่วยงาน</a></li>
            <li><a href="#">ข้อมูลการคลัง</a></li>
            <li><a href="#">ติดต่อเรา</a></li>
          </ul>
        </NavMenu>
      </Container>
    </HeaderContainer>
  );
};

export default Header;