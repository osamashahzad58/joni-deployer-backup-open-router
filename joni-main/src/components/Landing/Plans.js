import React, { useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useGetStartedModal } from "@/context/GetStartedModalContext";

const Plans = () => {
  const { user, instance } = useAuth();
  const { openModal } = useGetStartedModal();

  const canConnectChannel = user && instance && instance.status === 'ready' && !instance.channelCompleted && instance.ip && instance.token;
  const handleGetStarted = () => {
    if (canConnectChannel) {
      openModal(5, { ip: instance.ip, token: instance.token, instanceId: instance.instanceId });
    } else {
      openModal(1);
    }
  };

  const handleMouseMove = (e) => {
    const card = e.currentTarget; // this makes it work per card
    const rect = card.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * 5;
    const rotateY = ((x - centerX) / centerX) * 5;

    card.style.transform = `
      perspective(1000px)
      rotateX(${-rotateX}deg)
      rotateY(${rotateY}deg)
    `;
  };

  const handleMouseLeave = (e) => {
    const card = e.currentTarget;
    card.style.transform = `
      perspective(1000px)
      rotateX(0deg)
      rotateY(0deg)
    `;
  };

  return (
    <>
      <section className="planmain">
        <div className="custom-container">
          <h1 className="planhead">Flexible Plans for every need</h1>
          <div className="mainplancards">
            <div
              className="innercard"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <img
                src="/assets/plans/avatar.png"
                alt="avatarimg"
                className="avatarimg"
              />
              <h5 className="cardhead">Light Usage</h5>
              <p className="cardpara">For occasional tasks</p>
              <h6 className="listhead">Ideal for</h6>
              <div className="listmain">
                <span className="listcircle"></span>
                <p className="listpara">Trying out the platform</p>
              </div>
              <div className="listmain">
                <span className="listcircle"></span>
                <p className="listpara">Personal or infrequent automation</p>
              </div>
              <div className="listmain">
                <span className="listcircle"></span>
                <p className="listpara">Light experimentation</p>
              </div>
              <h6 className="listhead">What you get</h6>
              <div className="listmain">
                <span className="listcircle"></span>
                <p className="listpara">Access to all core capabilities</p>
              </div>
              <div className="listmain">
                <span className="listcircle"></span>
                <p className="listpara">Suitable for short, ad-hoc tasks</p>
              </div>
              <div className="listmain">
                <span className="listcircle"></span>
                <p className="listpara">Stable performance for low usage</p>
              </div>
              <div className="listmain">
                <span className="listcircle"></span>
                <p className="listpara">
                  Same features as higher plans, scaled for light activity
                </p>
              </div>
              <h2 className="dollaramount">
                $99 <span className="time">/month</span>
              </h2>
              <button type="button" className="getbtn" onClick={handleGetStarted}>
                {canConnectChannel ? 'Connect channel' : 'Get Started'}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                >
                  <path
                    d="M5.25 10.5L8.75 7L5.25 3.5"
                    stroke="white"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            <div
              className="innercard"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <img
                src="/assets/plans/avatar.png"
                alt="avatarimg"
                className="avatarimg"
              />
              <h5 className="cardhead">Standard Usage</h5>
              <p className="cardpara">For regular daily work</p>
              <h6 className="listhead">Ideal for</h6>
              <div className="listmain">
                <span className="listcircle"></span>
                <p className="listpara">Daily task execution</p>
              </div>
              <div className="listmain">
                <span className="listcircle"></span>
                <p className="listpara">Consistent automation needs</p>
              </div>
              <div className="listmain">
                <span className="listcircle"></span>
                <p className="listpara">
                  Individual professionals or small teams
                </p>
              </div>
              <h6 className="listhead">What you get</h6>
              <div className="listmain">
                <span className="listcircle"></span>
                <p className="listpara">Everything in Light Usage</p>
              </div>
              <div className="listmain">
                <span className="listcircle"></span>
                <p className="listpara">Higher execution capacity</p>
              </div>
              <div className="listmain">
                <span className="listcircle"></span>
                <p className="listpara">Optimized for daily workflows</p>
              </div>
              <div className="listmain">
                <span className="listcircle"></span>
                <p className="listpara">Reliable performance for regular use</p>
              </div>
              <h2 className="dollaramount">
                $199 <span className="time">/month</span>
              </h2>
              <button type="button" className="getbtn" onClick={handleGetStarted}>
                {canConnectChannel ? 'Connect channel' : 'Get Started'}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                >
                  <path
                    d="M5.25 10.5L8.75 7L5.25 3.5"
                    stroke="white"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            <div
              className="innercard activecard"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <span className="popularspan">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                >
                  <g clip-path="url(#clip0_395_602)">
                    <path
                      d="M4.59036 1.1722C4.60821 1.07661 4.65893 0.990285 4.73373 0.928162C4.80853 0.866038 4.9027 0.832031 4.99994 0.832031C5.09717 0.832031 5.19135 0.866038 5.26615 0.928162C5.34095 0.990285 5.39167 1.07661 5.40952 1.1722L5.84744 3.48803C5.87854 3.65267 5.95855 3.80412 6.07704 3.9226C6.19552 4.04108 6.34696 4.12109 6.51161 4.1522L8.82744 4.59011C8.92302 4.60797 9.00935 4.65868 9.07147 4.73349C9.1336 4.80829 9.1676 4.90246 9.1676 4.9997C9.1676 5.09693 9.1336 5.1911 9.07147 5.26591C9.00935 5.34071 8.92302 5.39143 8.82744 5.40928L6.51161 5.8472C6.34696 5.8783 6.19552 5.95831 6.07704 6.07679C5.95855 6.19527 5.87854 6.34672 5.84744 6.51136L5.40952 8.8272C5.39167 8.92278 5.34095 9.00911 5.26615 9.07123C5.19135 9.13335 5.09717 9.16736 4.99994 9.16736C4.9027 9.16736 4.80853 9.13335 4.73373 9.07123C4.65893 9.00911 4.60821 8.92278 4.59036 8.8272L4.15244 6.51136C4.12134 6.34672 4.04132 6.19527 3.92284 6.07679C3.80436 5.95831 3.65292 5.8783 3.48827 5.8472L1.17244 5.40928C1.07686 5.39143 0.990529 5.34071 0.928406 5.26591C0.866282 5.1911 0.832275 5.09693 0.832275 4.9997C0.832275 4.90246 0.866282 4.80829 0.928406 4.73349C0.990529 4.65868 1.07686 4.60797 1.17244 4.59011L3.48827 4.1522C3.65292 4.12109 3.80436 4.04108 3.92284 3.9226C4.04132 3.80412 4.12134 3.65267 4.15244 3.48803L4.59036 1.1722Z"
                      stroke="white"
                      stroke-width="1.1"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <path
                      d="M8.33325 0.833008V2.49967"
                      stroke="white"
                      stroke-width="1.1"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <path
                      d="M9.16667 1.66699H7.5"
                      stroke="white"
                      stroke-width="1.1"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <path
                      d="M1.66671 9.16667C2.12694 9.16667 2.50004 8.79357 2.50004 8.33333C2.50004 7.8731 2.12694 7.5 1.66671 7.5C1.20647 7.5 0.833374 7.8731 0.833374 8.33333C0.833374 8.79357 1.20647 9.16667 1.66671 9.16667Z"
                      stroke="white"
                      stroke-width="1.1"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_395_602">
                      <rect width="10" height="10" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
                Popular
              </span>
              <img
                src="/assets/plans/avatar.png"
                alt="avatarimg"
                className="avatarimg"
              />
              <h5 className="heavycardhead">Heavy Usage</h5>
              <p className="cardpara">For intensive, Ongoing execution</p>
              <h6 className="listhead">Ideal for</h6>
              <div className="listmain">
                <span className="listcircle"></span>
                <p className="listpara">Power users</p>
              </div>
              <div className="listmain">
                <span className="listcircle"></span>
                <p className="listpara">Ongoing automation</p>
              </div>
              <div className="listmain">
                <span className="listcircle"></span>
                <p className="listpara">High-frequency or long-running tasks</p>
              </div>
              <h6 className="listhead">What you get</h6>
              <div className="listmain">
                <span className="listcircle"></span>
                <p className="listpara">Everything in Standard Usage</p>
              </div>
              <div className="listmain">
                <span className="listcircle"></span>
                <p className="listpara">Maximum usage capacity</p>
              </div>
              <div className="listmain">
                <span className="listcircle"></span>
                <p className="listpara">Designed for intensive workloads</p>
              </div>
              <div className="listmain">
                <span className="listcircle"></span>
                <p className="listpara">
                  Priority handling for sustained execution
                </p>
              </div>
              <div className="lastamount">
              <h2 className="heavydollaramount">
                $249 
              </h2>
              <p className="time">/month</p>
              </div>
              <button type="button" className="heavygetbtn" onClick={handleGetStarted}>
                {canConnectChannel ? 'Connect channel' : 'Get Started'}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                >
                  <path
                    d="M5.25 10.5L8.75 7L5.25 3.5"
                    stroke="white"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Plans;
