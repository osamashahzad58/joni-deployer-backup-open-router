import GradientText from '@/component/GradientText';
import { useAuth } from '@/context/AuthContext';
import { useGetStartedModal } from '@/context/GetStartedModalContext';
import React from 'react';
import TypewriterHeading from '../TypeWriting';

const Banner = () => {
  const { user, instance } = useAuth();
  const { openModal } = useGetStartedModal();

  const canConnectChannel = user && instance && instance.status === 'ready' && !instance.channelCompleted && instance.ip && instance.token;
  const handleCta = () => {
    if (canConnectChannel) {
      openModal(5, { ip: instance.ip, token: instance.token, instanceId: instance.instanceId });
    } else {
      openModal(1);
    }
  };

  return (
    <>
      <section className="coming-soon">
        <div className="custom-container">
          <div className="main-content">
            <img src="/assets/banner/starfish.png" alt="img" className="img-fluid" />
            <TypewriterHeading />
            <GradientText colors={["#DF0F8E ", "#4C74FB ", "#DF0F8E"]} animationSpeed={8} showBorder={false} className="custom-class"> AI Magic </GradientText>
            <h2 className="glitch" data-text="With 8 Arms">With 8 Arms</h2>
            <button type="button" className="btn-common" onClick={handleCta}>
              <span className="btn-shine" />
              {canConnectChannel ? 'Connect channel' : 'Get Started'}
            </button>
          </div>
        </div>
      </section>
    </>
  );
};

export default Banner
