import React, { useEffect, useRef } from "react";

const CustomCursor = () => {
    const cursorRef = useRef(null);
    const followerRef = useRef(null);

    useEffect(() => {
        let mouseX = 0;
        let mouseY = 0;
        let followerX = 0;
        let followerY = 0;

        const delay = 0.06; // smaller = more lag

        const moveCursor = (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;

            // MAIN CURSOR = instant
            if (cursorRef.current) {
                cursorRef.current.style.left = mouseX + "px";
                cursorRef.current.style.top = mouseY + "px";
            }
        };

        const animate = () => {
            // FOLLOWER = smooth lag
            followerX += (mouseX - followerX) * delay;
            followerY += (mouseY - followerY) * delay;

            if (followerRef.current) {
                followerRef.current.style.left = followerX + "px";
                followerRef.current.style.top = followerY + "px";
            }

            requestAnimationFrame(animate);
        };

        window.addEventListener("mousemove", moveCursor);
        animate();

        return () => {
            window.removeEventListener("mousemove", moveCursor);
        };
    }, []);



    return (
        <>
            <div ref={cursorRef} className="custom-cursor"></div>
            <div ref={followerRef} className="custom-cursor-follower"></div>
        </>
    );
};

export default CustomCursor;
