import { Flex } from "antd";
import { ScheduleOutlined } from "@ant-design/icons";
import { Container } from '../container/container.styled.ts';
import { lime } from '@ant-design/colors';
import { Typography } from 'antd';
import styled from "styled-components";
import {JSX} from "react";
const { Title } = Typography;

const StyledHeader = styled.header`
    padding: 10px;
    background-color: ${lime[6]};
`


const Header = function Header(): JSX.Element {
  return (
    <StyledHeader>
      <Container>
        <Flex justify="space-between" align="center">
          <Flex justify="flex-start" align="center">
            <ScheduleOutlined style={{
              color: lime[0],
              fontSize: "40px",
              marginRight: "10px",
            }}/>
            <Title style={{margin: "unset", color: lime[0]}} level={1}>
              Todo app
            </Title>
          </Flex>
        </Flex>
      </Container>
    </StyledHeader>
  );
}

export default Header;