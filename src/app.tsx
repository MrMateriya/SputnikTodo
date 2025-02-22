import { Header } from "./UI";
import { Home } from "./pages";
import {JSX} from "react";

const App = function App(): JSX.Element {
  return (
    <>
      <Header/>
      <Home/>
    </>
  );
}

export default App;