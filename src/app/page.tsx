"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Crimson_Pro } from "next/font/google";

const crimsonPro = Crimson_Pro({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  variable: "--font-crimson-pro",
});

export default function LandingPage() {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`min-h-screen bg-white relative overflow-hidden ${crimsonPro.variable}`}>
      {/* Decorative Background Circles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Ellipse 1 - Above the fold (top center) */}
        <div
          className="absolute rounded-full"
          style={{
            width: '1203px',
            height: '1203px',
            top: '-159px',
            left: '50%',
            transform: 'translateX(-50%) translateX(7px)',
            background: 'radial-gradient(50% 50% at 50% 50%, rgba(255, 224, 130, 0.2) 0%, rgba(255, 255, 255, 0) 100%)',
            filter: 'blur(80px)',
          }}
        />

        {/* Ellipse 2 - Lower section right side (PURPLE) */}
        <div
          className="absolute rounded-full"
          style={{
            width: '1542px',
            height: '1542px',
            top: '611px',
            left: '50%',
            transform: 'translateX(-50%) translateX(100px)',
            background: 'radial-gradient(50% 50% at 50% 50%, rgba(188, 73, 220, 0.85) 0%, rgba(255, 255, 255, 0) 100%)',
            filter: 'blur(100px)',
          }}
        />

        {/* Ellipse 3 - Lower section left side (ORANGE) */}
        <div
          className="absolute rounded-full"
          style={{
            width: '1534px',
            height: '1534px',
            top: '731px',
            left: '50%',
            transform: 'translateX(-50%) translateX(-209px)',
            background: 'radial-gradient(50% 50% at 50% 50%, rgba(255, 182, 146, 0.3) 0%, rgba(255, 255, 255, 0) 100%)',
            filter: 'blur(100px)',
          }}
        />
      </div>

      {/* Navigation */}
      <nav className={`sticky top-0 z-50 px-6 py-6 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-sm' : ''}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-normal text-black" style={{ fontFamily: 'var(--font-crimson-pro)' }}>
              woven
            </Link>
            <div className="flex items-center gap-8 text-[18px]" style={{ fontFamily: 'var(--font-crimson-pro)', fontWeight: 300 }}>
              <a href="#about-woven" className="text-black hover:opacity-70 transition-opacity">
                about Woven
              </a>
              <a href="#how-it-works" className="text-black hover:opacity-70 transition-opacity">
                how it works
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 md:pt-40 pb-16 md:pb-32 px-4 md:px-6">
        <div className="max-w-[591px] mx-auto">
          <div className="text-center mb-6 md:mb-8">
            <h1
              className="text-[32px] md:text-[40px] leading-[32px] md:leading-[40px] mb-2 text-black"
              style={{
                fontFamily: 'var(--font-crimson-pro)',
                fontWeight: 300,
              }}
            >
              Your new fitting room is a community
            </h1>
            <p
              className="text-[18px] md:text-[20px] leading-[18px] md:leading-[20px] text-center"
              style={{
                fontFamily: 'var(--font-crimson-pro)',
                fontWeight: 300,
                opacity: 0.7,
              }}
            >
              Know it fits before you buy
            </p>
          </div>

          <div className="flex justify-center mb-8 md:mb-16">
            <Link
              href="/analyze"
              className="inline-flex items-center justify-center px-8 py-4 bg-[#C3B300] text-white text-[16px] md:text-[18px] font-medium rounded-2xl hover:bg-[#B0A300] transition-all w-full max-w-[370px] h-[50px] border border-[#e4e4ce]"
            >
              Try it now
            </Link>
          </div>
        </div>
      </section>

      {/* App Demo Section */}
      <section className="relative z-10 py-16 md:py-32 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Demo GIF - matching Figma dimensions */}
          <div
            className="rounded-[10px] shadow-lg overflow-hidden"
            style={{
              maxWidth: '849px',
              margin: '0 auto',
            }}
          >
            <img
              src="/woven-demo.gif"
              alt="Woven app demonstration"
              className="w-full h-auto"
              style={{
                display: 'block',
              }}
            />
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="relative z-10 py-24 md:py-40 px-4 md:px-6">
        <div className="max-w-[713px] mx-auto text-center">
          <h2
            className="text-[48px] md:text-[72px] leading-[42px] md:leading-[61.2px] text-black mb-8"
            style={{
              fontFamily: 'var(--font-crimson-pro)',
              fontWeight: 300,
            }}
          >
            All the reviews you need, none of the guessing.
          </h2>
        </div>
      </section>

      {/* About Woven Section */}
      <section id="about-woven" className="relative z-10 py-24 md:py-40 px-4 md:px-6">
        <div className="max-w-[713px] mx-auto text-center">
          <p
            className="text-[28px] md:text-[40px] leading-[32px] md:leading-[40px] text-black"
            style={{
              fontFamily: 'var(--font-crimson-pro)',
              fontWeight: 300,
            }}
          >
            Woven helps you find the right size based on real reviews from women like you—no more guessing, no more returns.
          </p>
        </div>
      </section>

      {/* Product Visualization Section */}
      <section className="relative z-10 py-24 md:py-40 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative flex flex-col md:flex-row items-center justify-center min-h-[600px] md:min-h-[700px]">
            {/* Center product image - lowest z-index */}
            <Image
              src="/jeans.png"
              alt="Frame wide-leg jeans"
              width={348}
              height={517}
              className="relative z-0 w-full max-w-[348px] h-auto block shadow-[0px_3.617px_5.426px_0px_rgba(0,0,0,0.02),0px_9.043px_16.277px_0px_rgba(0,0,0,0.02),0px_16.277px_50.639px_0px_rgba(0,0,0,0.04)]"
            />

            {/* Left review cards - overlapping on top of image */}
            <div className="hidden md:flex md:absolute md:left-[5%] lg:left-[10%] xl:left-[15%] top-[15%] flex-col gap-4 z-20">
              <div
                className="bg-[#fffde4] border border-[#f1eded] rounded-[10px] p-6 w-[305px] shadow-md"
                style={{ transform: 'rotate(3.276deg)' }}
              >
                <p className="text-[14px] text-[rgba(0,0,0,0.6)] font-medium mb-4 leading-relaxed">
                  &ldquo;Frame wide-leg jeans: soft, curve-friendly, and literally perfect. These jeans are hands-down one of the most comfortable pair I have ever put on my body&rdquo;
                </p>
                <p className="text-[14px] text-[rgba(0,0,0,0.7)] font-semibold underline">
                  themomedit.com
                </p>
              </div>
              <div
                className="bg-[#f0f4ea] border border-[#f1eded] rounded-[10px] p-6 w-[296px] shadow-md"
                style={{ transform: 'rotate(-11.171deg)' }}
              >
                <p className="text-[14px] text-[rgba(0,0,0,0.6)] font-medium mb-4 leading-relaxed">
                  &ldquo;I love these jeans... I&apos;m a size 8 normally and the 26 fit me perfectly&rdquo;
                </p>
                <p className="text-[14px] text-[rgba(0,0,0,0.7)] font-semibold underline">
                  anthropologie.com
                </p>
              </div>
            </div>

            {/* Right recommendation card - overlapping on top of image */}
            <div className="md:absolute md:right-[5%] lg:right-[10%] xl:right-[15%] md:top-[25%] bg-white border border-[#f1eded] rounded-[10px] p-6 w-full max-w-[384px] shadow-md z-20 mt-8 md:mt-0">
              <h3 className="text-[16px] font-semibold text-black opacity-70 mb-4">
                True to size: order 26
              </h3>
              <p className="text-[14px] text-[rgba(0,0,0,0.6)] font-medium mb-4 leading-relaxed">
                Based on your UK 6-8 (approx waist 24-26&rdquo; / 61-66cm) and preference for a well-fitting jean, a size 26 best matches the high-rise, fitted-hip cut
              </p>
              <div className="space-y-2">
                <h4 className="text-[16px] font-semibold text-black opacity-70">
                  Fabric and stretch
                </h4>
                <p className="text-[14px] text-[rgba(0,0,0,0.6)] font-medium leading-relaxed">
                  100% stretch cotton. Reviewers mention that this style is high-stretch, so the waist and hip have some give after wear.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative z-10 py-24 md:py-40 px-4 md:px-6">
        <div className="max-w-[591px] mx-auto text-center space-y-6">
          <h2
            className="text-[28px] md:text-[40px] leading-[32px] md:leading-[40px] text-black"
            style={{
              fontFamily: 'var(--font-crimson-pro)',
              fontWeight: 300,
            }}
          >
            Tell Woven what you want to buy, we&apos;ll do all the work for you
          </h2>
          <div className="flex justify-center mb-12">
            <Link
              href="/analyze"
              className="inline-flex items-center justify-center px-8 py-4 bg-[#C3B300] text-white text-[16px] md:text-[18px] font-medium rounded-2xl hover:bg-[#B0A300] transition-all w-full max-w-[370px] h-[50px] border border-[#e4e4ce]"
            >
              Try it now
            </Link>
          </div>
          {/* Form Screenshot */}
          <div className="flex justify-center">
            <div className="border border-[rgba(0,0,0,0.1)] rounded-[10px] overflow-hidden max-w-[533px] w-full shadow-sm">
              <Image
                src="/form-screenshot.png"
                alt="Woven product form interface"
                width={533}
                height={319}
                className="w-full h-auto block"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer className="relative z-10 py-16 md:py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-stone-500 text-sm">
            © {new Date().getFullYear()} Woven. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
