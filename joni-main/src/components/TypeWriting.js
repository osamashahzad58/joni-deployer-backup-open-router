"use client";

import { useEffect, useState } from "react";

const texts = ["A Multi-Agent platform that changes the game."];
const typingSpeed = 50;
const deletingSpeed = 40;
const pauseTime = 2500;

export default function TypewriterHeading() {
    const [text, setText] = useState("");
    const [index, setIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const current = texts[index];
        let timeout; // ✅ JS doesn't need type here

        if (!isDeleting && text.length < current.length) {
            timeout = setTimeout(() => {
                setText(current.slice(0, text.length + 1));
            }, typingSpeed);
        } else if (isDeleting && text.length > 0) {
            timeout = setTimeout(() => {
                setText(current.slice(0, text.length - 1));
            }, deletingSpeed);
        } else {
            timeout = setTimeout(() => {
                setIsDeleting(!isDeleting);
                if (!isDeleting) return;
                setIndex((prev) => (prev + 1) % texts.length);
            }, pauseTime);
        }

        return () => clearTimeout(timeout);
    }, [text, isDeleting, index]);

    return (
        <>
            <p className="para"> <span className="pink-cursor">|</span> {text}</p>
        </>
    );
}
