import React from 'react';
import styled from 'styled-components';

const FooterContainer = styled.footer`
  text-align: center;
  padding: 10px;
  background-color: #1a2a44;
  color: white;
  position: fixed;
  bottom: 0;
  width: 100%;
`;

const Footer = () => {
  return (
    <FooterContainer>
      <p>© 2025 Ministry of Finance Thailand</p>
    </FooterContainer>
  );
};

export default Footer;