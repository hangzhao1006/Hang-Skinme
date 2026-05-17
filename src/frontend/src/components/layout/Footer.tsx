'use client'

import React from 'react';

const Footer: React.FC = () => {
    // UI View
    return (
        <footer className="footer">
            <div className="container mx-auto px-4">
                <p className="footer-text">
                    Copyright © {new Date().getFullYear()} SkinMe. All Rights Reserved.
                </p>
            </div>
        </footer>
    );
}

export default Footer;
