import styled from "styled-components";

const Container = styled.div`
    margin: 0 auto;
    max-width: 100%;
    padding: 0 10px;

    @media (min-width: 480px) {
        padding: 0 15px;
    }
    
    @media (min-width: 768px) {
        padding: 0 20px;
    }

    @media (min-width: 1280px) {
        padding: 0 25px;
    }
    
    @media (min-width: 1300px) {
        max-width: 1200px;
        padding: unset;
    }
`

export { Container }