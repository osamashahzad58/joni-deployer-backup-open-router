import React from 'react'

const Chat = () => {
    return (
        <>
            <div className="parent-twice-section">
                <section className="chat-section">
                    <div className="custom-container">
                        <h4>Integrates with your chat app</h4>
                        <div className="social-parent">
                            <div className="single">
                                <img src="\assets\social\telegram.svg" alt="img" className='img-fluid' />
                                <p>Telegram</p>
                            </div>
                            <div className="single">
                                <img src="\assets\social\whatsapp.svg" alt="img" className='img-fluid' />
                                <p>WhatsApp</p>
                            </div>
                            <div className="single">
                                <img src="\assets\social\discord.svg" alt="img" className='img-fluid' />
                                <p>Discord</p>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="execute-section">
                    <div className="custom-container">
                        <h4>Executes tasks on command</h4>
                        <div className="parent">
                            <div className="single">
                                <img src="\assets\chat\1.svg" alt="img" className='img-fluid' />
                                <h6>Spotless communication</h6>
                                <p>Communicates through your chat app in real-time</p>
                            </div>
                            <div className="single">
                                <img src="\assets\chat\2.svg" alt="img" className='img-fluid' />
                                <h6>Breathtaking speed</h6>
                                <p>Can run 8 tasks simultaneously, 0 time wasted</p>
                            </div>
                            <div className="single">
                                <img src="\assets\chat\3.svg" alt="img" className='img-fluid' />
                                <h6>Continuous learning</h6>
                                <p>The more we work for you, the smarter we get</p>
                            </div>
                            <div className="single">
                                <img src="\assets\chat\4.svg" alt="img" className='img-fluid' />
                                <h6>Continuous learning</h6>
                                <p>The more we work for you, the smarter we get</p>
                            </div>
                            <div className="single">
                                <img src="\assets\chat\5.svg" alt="img" className='img-fluid' />
                                <h6>Shared learning</h6>
                                <p>Agents teach each other for deeper understanding</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    )
}

export default Chat
