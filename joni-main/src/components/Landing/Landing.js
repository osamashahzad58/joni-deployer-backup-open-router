import React from "react";
import Banner from "./Banner";
import Join from "./Join";
import Central from "./Central";
import Chat from './Chat'
import Particles from '../Particles'
import AnimatedBackground from '../AnimatedBackground'
import Plans from "./Plans";
import Getnow from "./Getnow";
import Footer from '../Footer'

const Landing = () => {
  return (
    <>
      <Particles />
      <AnimatedBackground />
      <Banner />
      <Join />
      <Central />
      <Chat />
      <Plans />
      <Getnow />
      <Footer />
    </>
  );
};

export default Landing;
