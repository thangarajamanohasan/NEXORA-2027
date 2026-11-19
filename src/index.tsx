import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Clock,
  Monitor,
  BriefcaseBusiness,
  Users,
  GraduationCap,
  Lightbulb,
  Code2,
  Network,
  Sparkles,
  Laptop,
  Target,
  Building2,
  UserRound,
  Ticket,
  CheckCircle2,
} from "lucide-react";

const eventDate = new Date("2027-01-19T09:00:00+05:30").getTime();

function getCountdown() {
  const distance = Math.max(0, eventDate - Date.now());
  return {
    days: Math.floor(distance / 86400000),
    hours: Math.floor((distance % 86400000) / 3600000),
    minutes: Math.floor((distance % 3600000) / 60000),
    seconds: Math.floor((distance % 60000) / 1000),
  };
}

const stars = Array.from({ length: 35 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  top: `${(i * 53) % 100}%`,
  delay: `${(i % 8) * 0.7}s`,
  duration: `${2 + (i % 4)}s`,
}));

export default function Index() {
  const [countdown, setCountdown] = useState(getCountdown());

  useEffect(() => {
    const timer = setInterval(() => setCountdown(getCountdown()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="nexora">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #080a19; }
        .nexora {
          font-family: 'DM Sans', sans-serif;
          color: #17182f;
          background: #f7f8fd;
          overflow: hidden;
        }
        .nexora a { text-decoration: none; color: inherit; }
        .nexora button { font-family: inherit; }

        /* NAVBAR */
        .nav {
          width: 100%; height: 82px;
          padding: 0 max(5%, calc((100% - 1250px)/2));
          display: flex; align-items: center;
          justify-content: space-between;
          background: #ffffffed;
          backdrop-filter: blur(18px);
          position: sticky; top: 0; z-index: 100;
          border-bottom: 1px solid #e9eaf3;
        }
        .brand {
          display: flex; align-items: center;
          gap: 12px; min-width: 190px;
        }
        .brand img {
          width: 53px; height: 53px;
          object-fit: contain; border-radius: 10px;
        }
        .brand-name {
          font: 700 21px 'Space Grotesk';
          letter-spacing: 2px; color: #17182f;
        }
        .brand-name span { color: #5269e9; }
        .brand small {
          display: block; font-size: 8px;
          letter-spacing: 1.2px; color: #85899d;
          margin-top: 3px; font-weight: 700;
        }
        .nav-links {
          display: flex; align-items: center; gap: 29px;
          color: #656981; font-size: 12px; font-weight: 700;
        }
        .nav-links a { transition: .25s; }
        .nav-links a:hover { color: #7655e8; }
        .nav-button {
          display: inline-flex; align-items: center;
          gap: 10px; padding: 13px 19px;
          color: white !important; border-radius: 9px;
          background: linear-gradient(100deg,#3567ef,#9250e9);
          font-size: 11px; font-weight: 800;
          box-shadow: 0 8px 22px #7655e833;
          transition: .3s;
        }
        .nav-button:hover { transform: translateY(-3px); box-shadow: 0 12px 25px #7655e855; }

        /* HERO */
        .hero {
          position: relative; min-height: 680px;
          padding: 100px max(7%,calc((100% - 1200px)/2));
          display: flex; align-items: center;
          color: white; overflow: hidden;
          background:
            radial-gradient(ellipse at 80% 50%,#422b83 0%,transparent 42%),
            linear-gradient(115deg,#080b22,#15183e 58%,#25164b);
        }
        .hero:before {
          content: ""; position: absolute; inset: 0;
          background-image:
            linear-gradient(#ffffff0a 1px,transparent 1px),
            linear-gradient(90deg,#ffffff0a 1px,transparent 1px);
          background-size: 55px 55px;
          mask-image: linear-gradient(90deg,black,transparent);
        }
        .hero:after {
          content: ""; position: absolute;
          width: 450px; height: 450px; right: 5%; top: 10%;
          border-radius: 50%;
          background: #744cff22;
          filter: blur(90px);
          animation: glowPulse 5s ease-in-out infinite;
        }
        .hero-content { position: relative; z-index: 5; max-width: 650px; }
        .eyebrow {
          display: inline-flex; align-items: center; gap: 11px;
          color: #b9c8ff; font-size: 10px;
          letter-spacing: 2px; font-weight: 800;
          padding: 10px 15px; border: 1px solid #ffffff24;
          border-radius: 30px; background: #ffffff0b;
        }
        .live-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #64f2c2; box-shadow: 0 0 15px #64f2c2;
          animation: blink 1.5s infinite;
        }
        .hero-kicker {
          margin-top: 38px; color: #c1c4e4;
          font-size: 11px; letter-spacing: 2.5px;
          font-weight: 700;
        }
        .hero h1 {
          font: 700 clamp(48px,6vw,79px)/1.04 'Space Grotesk';
          letter-spacing: -3px; margin-top: 18px;
        }
        .gradient-text {
          background: linear-gradient(90deg,#78baff,#a68aff,#d3a5ff);
          -webkit-background-clip: text;
          background-clip: text; color: transparent;
        }
        .hero-description {
          margin-top: 25px; max-width: 480px;
          font-size: 14px; line-height: 1.9; color: #c7c9e1;
        }
        .hero-info {
          display: flex; flex-wrap: wrap; gap: 22px;
          margin-top: 27px; color: #e0e1f2; font-size: 11px;
        }
        .hero-info span { display: flex; gap: 9px; align-items: center; }
        .hero-info svg { color: #a99aff; }
        .primary-btn {
          margin-top: 32px; display: inline-flex;
          align-items: center; gap: 17px;
          padding: 15px 22px; border-radius: 9px;
          background: linear-gradient(100deg,#3567ef,#9250e9);
          color: white !important; font-size: 12px;
          font-weight: 800; transition: .3s;
          box-shadow: 0 10px 30px #6c55e544;
        }
        .primary-btn:hover { transform: translateY(-4px); box-shadow: 0 15px 35px #6c55e577; }

        /* 3D ANIMATION */
        .hero-art {
          position: absolute; right: 7%; top: 50%;
          transform: translateY(-50%);
          width: 440px; height: 440px;
          display: grid; place-items: center;
          perspective: 1000px; z-index: 2;
        }
        .orbit {
          position: absolute; border: 1px solid #aaa5ff45;
          border-radius: 50%; box-shadow: 0 0 18px #8c78ff12;
        }
        .orbit.one { width: 390px; height: 190px; transform: rotate(-25deg); animation: orbitOne 12s linear infinite; }
        .orbit.two { width: 340px; height: 340px; animation: orbitTwo 18s linear infinite; }
        .orbit.three { width: 260px; height: 410px; transform: rotate(50deg); animation: orbitOne 15s linear infinite reverse; }
        .core {
          width: 190px; height: 190px; border-radius: 50%;
          display: grid; place-items: center;
          background: radial-gradient(circle,#8974ff55,transparent 70%);
          box-shadow: 0 0 90px #7565ff55;
          animation: coreFloat 5s ease-in-out infinite;
        }
        .core img {
          width: 160px; height: 160px;
          object-fit: contain; border-radius: 20px;
          filter: drop-shadow(0 0 25px #8974ff88);
          animation: logoFloat 5s ease-in-out infinite;
        }
        .float-card {
          position: absolute; display: flex;
          align-items: center; gap: 10px;
          padding: 13px 17px; border-radius: 10px;
          background: #191a45dd; border: 1px solid #aaa5ff55;
          color: #e2e0ff; font-size: 10px;
          letter-spacing: 1px; backdrop-filter: blur(10px);
          box-shadow: 0 12px 30px #0003;
          animation: cardFloat 4s ease-in-out infinite;
        }
        .float-card svg { color: #b7a5ff; }
        .float-one { top: 50px; left: 0; }
        .float-two { right: 0; top: 180px; animation-delay: 1s; }
        .float-three { bottom: 45px; left: 30px; animation-delay: 2s; }

        /* SPARKLES AND SHOOTING STARS */
        .sparkle {
          position: absolute; width: 4px; height: 4px;
          border-radius: 50%; background: #fff;
          box-shadow: 0 0 10px 3px #a991ff;
          animation: sparkle var(--duration) ease-in-out infinite;
          animation-delay: var(--delay);
          pointer-events: none;
        }
        .shooting-star {
          position: absolute; width: 130px; height: 2px;
          background: linear-gradient(90deg,transparent,#fff,#9abaff,transparent);
          filter: drop-shadow(0 0 6px #a9baff);
          transform: rotate(-35deg);
          animation: shooting 5s linear infinite;
          pointer-events: none;
        }
        .shooting-star.s2 { animation-delay: 2.5s; top: 35%; left: -15%; }
        .shooting-star.s1 { top: 15%; left: -20%; }

        /* COUNTDOWN */
        .countdown {
          max-width: 1050px; margin: -1px auto 0;
          background: white; padding: 35px;
          border: 1px solid #e8e9f2;
          border-radius: 0 0 18px 18px;
          display: grid; grid-template-columns: 1fr 2fr;
          align-items: center; gap: 35px;
          box-shadow: 0 15px 40px #22254b08;
          position: relative; z-index: 5;
        }
        .countdown h2 { font: 700 25px 'Space Grotesk'; margin-top: 10px; }
        .section-label {
          color: #5269e9; font-size: 10px;
          font-weight: 800; letter-spacing: 2px;
        }
        .countdown-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; }
        .time-box {
          background: #f4f5fc; border: 1px solid #e9eafa;
          border-radius: 11px; padding: 15px 5px; text-align: center;
        }
        .time-box strong {
          display: block; font: 700 31px 'Space Grotesk'; color: #252448;
        }
        .time-box span {
          display: block; margin-top: 5px;
          font-size: 9px; letter-spacing: 1px;
          text-transform: uppercase; color: #898ca2;
        }

        /* COMMON SECTIONS */
        .section { max-width: 1100px; margin: auto; padding: 100px 30px; }
        .section h2 {
          font: 700 43px/1.15 'Space Grotesk';
          letter-spacing: -1.5px; margin-top: 18px;
        }
        .about {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 75px; align-items: center;
        }
        .about-copy .lead {
          font: 600 20px/1.6 'Space Grotesk'; color: #20213e;
        }
        .about-copy p:last-of-type {
          margin-top: 18px; font-size: 13px;
          color: #777b91; line-height: 2;
        }
        .note {
          display: flex; gap: 10px; align-items: center;
          margin-top: 25px; color: #7054d6;
          font-size: 12px; font-weight: 700;
        }
        .event-facts {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 12px; margin-top: 28px;
        }
        .fact {
          padding: 17px; background: #fff;
          border: 1px solid #e9eaf3; border-radius: 12px;
        }
        .fact svg { color: #7655e8; }
        .fact b { display: block; margin-top: 10px; font: 700 12px 'Space Grotesk'; }
        .fact small { display: block; margin-top: 5px; color: #85899d; font-size: 10px; }

        /* EXPERIENCE */
        .experience { background: #eff1fb; padding: 95px 30px; }
        .center { text-align: center; }
        .center p { color: #777b91; font-size: 13px; margin-top: 15px; line-height: 1.8; }
        .cards {
          max-width: 1100px; margin: 45px auto 0;
          display: grid; grid-template-columns: repeat(3,1fr); gap: 18px;
        }
        .card {
          min-height: 290px; padding: 28px; color: white;
          border-radius: 15px; position: relative; overflow: hidden;
          transition: .35s; transform-style: preserve-3d;
        }
        .card:hover { transform: translateY(-9px) rotateX(3deg); box-shadow: 0 20px 40px #29285a22; }
        .card:nth-child(1) { background: linear-gradient(140deg,#2859cf,#263b83); }
        .card:nth-child(2) { background: linear-gradient(140deg,#8050dc,#492d8c); }
        .card:nth-child(3) { background: linear-gradient(140deg,#252951,#11152f); }
        .card-icon {
          width: 46px; height: 46px; border-radius: 12px;
          background: #ffffff20; display: grid; place-items: center;
        }
        .card-number { position: absolute; right: 25px; top: 27px; color: #ffffff80; font-size: 13px; }
        .card h3 { font: 700 22px 'Space Grotesk'; margin-top: 28px; }
        .card p { margin-top: 12px; font-size: 12px; line-height: 1.9; color: #e1e2f4; }
        .card-footer {
          position: absolute; bottom: 23px; left: 28px; right: 28px;
          border-top: 1px solid #ffffff35; padding-top: 14px;
          font-size: 9px; letter-spacing: 1.3px;
          display: flex; justify-content: space-between;
        }

        /* AUDIENCE */
        .audience { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .audience-copy p { color: #777b91; font-size: 13px; line-height: 1.9; margin-top: 20px; }
        .audience-item {
          display: flex; align-items: center; gap: 15px;
          padding: 20px 0; border-bottom: 1px solid #e7e9f2;
        }
        .audience-icon {
          width: 45px; height: 45px; border-radius: 12px;
          background: #eeedff; color: #7655e8; display: grid; place-items: center;
        }
        .audience-item div:nth-child(2) { flex: 1; }
        .audience-item b { display: block; font: 600 14px 'Space Grotesk'; }
        .audience-item small { display: block; color: #85899d; font-size: 11px; margin-top: 5px; }

        /* PROGRAMME */
        .programme { background: white; max-width: none; padding: 95px 30px; }
        .programme-list { max-width: 1000px; margin: 45px auto 0; border-top: 1px solid #e7e9f2; }
        .programme-item {
          display: grid; grid-template-columns: 230px 1fr;
          gap: 25px; padding: 30px 0; border-bottom: 1px solid #e7e9f2;
        }
        .programme-time { display: flex; align-items: center; gap: 10px; font-size: 12px; font-weight: 700; color: #5269e9; }
        .programme-item small { font-size: 9px; letter-spacing: 1.5px; color: #5269e9; font-weight: 800; }
        .programme-item h3 { font: 700 20px 'Space Grotesk'; margin: 8px 0; }
        .programme-item p { font-size: 12px; color: #777b91; line-height: 1.8; }

        /* ORGANISERS */
        .organisers { background: #f0f1fa; }
        .organiser-card {
          max-width: 900px; margin: 40px auto 0;
          padding: 30px; background: white;
          border: 1px solid #e8e9f2; border-radius: 16px;
          display: grid; grid-template-columns: 1fr 1fr; gap: 25px;
        }
        .organiser-detail { display: flex; align-items: flex-start; gap: 14px; }
        .organiser-icon {
          width: 43px; height: 43px; flex-shrink: 0;
          display: grid; place-items: center;
          border-radius: 12px; background: #eeedff; color: #7655e8;
        }
        .organiser-detail b { display: block; font: 700 13px 'Space Grotesk'; }
        .organiser-detail small { display: block; margin-top: 7px; font-size: 11px; color: #777b91; line-height: 1.7; }

        /* VENUE */
        .venue-card {
          max-width: 1100px; margin: auto;
          display: grid; grid-template-columns: 1fr 1fr;
          background: white; border-radius: 18px; overflow: hidden;
          box-shadow: 0 20px 55px #24244b0a;
        }
        .venue-info { padding: 55px; }
        .venue-info p { color: #777b91; font-size: 13px; line-height: 1.9; margin-top: 20px; }
        .venue-detail {
          display: flex; gap: 12px; align-items: center;
          margin-top: 20px; font-size: 12px; font-weight: 600; color: #515777;
        }
        .venue-detail svg { color: #5269e9; }
        .venue-art {
          min-height: 350px; display: grid; place-items: center;
          position: relative; color: white;
          background: radial-gradient(circle at center,#5944a5,#171a47 70%);
          overflow: hidden;
        }
        .venue-art:before {
          content: ""; position: absolute; width: 270px; height: 270px;
          border-radius: 50%; border: 1px solid #ffffff55;
          box-shadow: 0 0 0 35px #ffffff08,0 0 0 70px #ffffff05;
          animation: orbitTwo 20s linear infinite;
        }
        .venue-symbol {
          width: 150px; height: 150px; border-radius: 30px;
          display: grid; place-items: center;
          background: #ffffff12; border: 1px solid #ffffff55;
          color: #c8b9ff; position: relative;
          box-shadow: 0 0 55px #a18cff44;
          animation: coreFloat 5s ease-in-out infinite;
        }

        /* CLOSING */
        .closing {
          text-align: center; padding: 100px 20px;
          background: radial-gradient(ellipse at 50% 0%,#44317d,#10122f 65%);
          color: white; position: relative; overflow: hidden;
        }
        .closing h2 { font: 700 53px/1.15 'Space Grotesk'; margin-top: 20px; }
        .closing p { margin-top: 20px; color: #c8c9e1; font-size: 12px; line-height: 1.8; }
        .closing .primary-btn { margin-top: 28px; }
        .register-note { margin-top: 18px; font-size: 10px; color: #c7c5e6; }
        footer {
          max-width: 1200px; margin: auto; padding: 25px 30px;
          display: flex; justify-content: space-between;
          align-items: center; color: #85899d; font-size: 10px;
        }
        .footer-brand { display: flex; align-items: center; gap: 10px; }
        .footer-brand img { width: 38px; height: 38px; object-fit: contain; }
        .footer-brand b { color: #5269e9; }

        /* ANIMATIONS */
        @keyframes blink { 50% { opacity: .35; box-shadow: 0 0 3px #64f2c2; } }
        @keyframes glowPulse { 0%,100% { opacity: .5; transform: scale(.9); } 50% { opacity: 1; transform: scale(1.15); } }
        @keyframes coreFloat { 0%,100% { transform: translateY(0) rotateY(0deg); } 50% { transform: translateY(-13px) rotateY(10deg); } }
        @keyframes logoFloat { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-8px) scale(1.04); } }
        @keyframes cardFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes orbitOne { to { rotate: 360deg; } }
        @keyframes orbitTwo { to { rotate: -360deg; } }
        @keyframes sparkle {
          0%,100% { opacity: 0; transform: scale(.3); }
          50% { opacity: 1; transform: scale(1.5); }
        }
        @keyframes shooting {
          0% { transform: translate(-20vw,-10vh) rotate(-35deg); opacity: 0; }
          10% { opacity: 1; }
          35% { opacity: 0; }
          100% { transform: translate(110vw,70vh) rotate(-35deg); opacity: 0; }
        }

        @media(max-width:900px) {
          .hero-art { right: -100px; opacity: .45; }
          .countdown { margin: 0 15px; }
          .about,.audience { gap: 35px; }
          .venue-info { padding: 35px; }
          .nav-links { gap: 15px; }
        }
        @media(max-width:650px) {
          .nav { height: 70px; padding: 0 16px; }
          .brand img { width: 43px; height: 43px; }
          .brand-name { font-size: 17px; }
          .brand small { font-size: 7px; }
          .nav-links { display: none; }
          .nav-button { padding: 11px 12px; font-size: 9px; }
          .hero { min-height: 690px; padding: 75px 23px; }
          .hero h1 { font-size: 49px; }
          .hero-art { width: 290px; height: 290px; right: -110px; top: 470px; opacity: .35; }
          .orbit.one { width: 260px; height: 130px; }
          .orbit.two { width: 250px; height: 250px; }
          .orbit.three { width: 200px; height: 300px; }
          .core { transform: scale(.7); }
          .float-card { transform: scale(.8); }
          .hero-info { display: grid; gap: 13px; }
          .countdown { grid-template-columns: 1fr; padding: 25px 18px; gap: 20px; }
          .countdown-grid { gap: 6px; }
          .time-box strong { font-size: 24px; }
          .section { padding: 75px 23px; }
          .section h2 { font-size: 36px; }
          .about,.audience { grid-template-columns: 1fr; gap: 30px; }
          .experience { padding: 75px 20px; }
          .cards { grid-template-columns: 1fr; gap: 13px; }
          .card { min-height: 255px; }
          .event-facts { grid-template-columns: 1fr 1fr; }
          .programme { padding: 75px 23px; }
          .programme-item { grid-template-columns: 1fr; gap: 15px; }
          .organiser-card { grid-template-columns: 1fr; padding: 23px; }
          .venue-card { grid-template-columns: 1fr; }
          .venue-info { padding: 35px 25px; }
          .venue-art { min-height: 280px; }
          .closing { padding: 75px 20px; }
          .closing h2 { font-size: 39px; }
          footer { padding: 22px 18px; gap: 15px; flex-wrap: wrap; }
        }
        @media(prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      {/* NAVIGATION */}
      <nav className="nav">
        <a href="/" className="brand">
          <img src="/nexora-logo.png" alt="NEXORA 2027 Logo" />
          <span>
            <span className="brand-name">
              NEXORA <span>2027</span>
            </span>
            <small>EMPOWERING TOMORROW'S INNOVATORS</small>
          </span>
        </a>

        <div className="nav-links">
          <a href="#about">About</a>
          <a href="#experience">Exhibition</a>
          <a href="#audience">Who Can Join</a>
          <a href="#programme">Programme</a>
          <a href="#venue">Venue</a>
        </div>

        <a href="/register" className="nav-button">
          Register Now <ArrowRight size={15} />
        </a>
      </nav>

      {/* HERO */}
      <section className="hero" id="home">
        {stars.map((star, i) => (
          <span
            key={i}
            className="sparkle"
            style={
              {
                left: star.left,
                top: star.top,
                "--delay": star.delay,
                "--duration": star.duration,
              } as React.CSSProperties
            }
          />
        ))}
        <span className="shooting-star s1" />
        <span className="shooting-star s2" />

        <div className="hero-content">
          <div className="eyebrow">
            <span className="live-dot" />
            THE FUTURE STARTS HERE
          </div>

          <p className="hero-kicker">
            IT EXHIBITION & CAREER DEVELOPMENT PROGRAMME
          </p>

          <h1>
            Empowering
            <br />
            Tomorrow's
            <br />
            <span className="gradient-text">Innovators.</span>
          </h1>

          <p className="hero-description">
            Explore technology. Discover opportunities. Connect with the future
            of IT. Join NEXORA 2027 and take your first step towards a world of
            innovation, knowledge and career possibilities.
          </p>

          <div className="hero-info">
            <span>
              <CalendarDays size={17} /> 19 January 2027
            </span>
            <span>
              <MapPin size={17} /> Thondaman Vocational Training Centre
            </span>
          </div>

          <a href="/register" className="primary-btn">
            Register as a Participant <ArrowRight size={18} />
          </a>
        </div>

        <div className="hero-art">
          <div className="orbit one" />
          <div className="orbit two" />
          <div className="orbit three" />
          <div className="core">
            <img src="/nexora-logo.png" alt="NEXORA 2027" />
          </div>
          <div className="float-card float-one">
            <Code2 size={19} /> CREATE
          </div>
          <div className="float-card float-two">
            <Lightbulb size={19} /> INNOVATE
          </div>
          <div className="float-card float-three">
            <Network size={19} /> CONNECT
          </div>
        </div>
      </section>

      {/* COUNTDOWN */}
      <section className="countdown">
        <div>
          <span className="section-label">SAVE THE DATE</span>
          <h2>The countdown has begun.</h2>
        </div>
        <div className="countdown-grid">
          {Object.entries(countdown).map(([label, value]) => (
            <div className="time-box" key={label}>
              <strong>{String(value).padStart(2, "0")}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section className="section about" id="about">
        <div>
          <span className="section-label">01 — ABOUT NEXORA</span>
          <h2>
            A platform for the
            <br />
            <span className="gradient-text">next generation.</span>
          </h2>
          <div className="event-facts">
            <div className="fact">
              <CalendarDays size={20} />
              <b>19 January 2027</b>
              <small>Tuesday</small>
            </div>
            <div className="fact">
              <Users size={20} />
              <b>250 Seats</b>
              <small>Limited participant capacity</small>
            </div>
            <div className="fact">
              <Monitor size={20} />
              <b>IT Exhibition</b>
              <small>9:00 AM – 11:30 AM</small>
            </div>
            <div className="fact">
              <BriefcaseBusiness size={20} />
              <b>Career Programme</b>
              <small>12:00 PM – 4:00 PM</small>
            </div>
          </div>
        </div>

        <div className="about-copy">
          <p className="lead">
            NEXORA 2027 brings technology, education and career opportunities
            together under one roof.
          </p>
          <p>
            Organised at Thondaman Vocational Training Centre, this IT
            Exhibition and Career Development Programme is designed to inspire
            the next generation of technology enthusiasts. It provides an
            opportunity to explore practical IT concepts, discover emerging
            technologies and understand the career paths available in the
            information technology industry.
          </p>
          <p>
            Whether you are a school leaver planning your future, a university
            student expanding your knowledge, or a job seeker looking for
            direction, NEXORA offers a platform to learn, connect and grow.
          </p>
          <div className="note">
            <Sparkles size={19} />
            Learn something new. Find your direction. Shape what comes next.
          </div>
        </div>
      </section>

      {/* EXPERIENCE */}
      <section className="experience" id="experience">
        <div className="center">
          <span className="section-label">02 — WHAT TO EXPECT</span>
          <h2>
            More than an exhibition.
            <br />
            <span className="gradient-text">An experience.</span>
          </h2>
          <p>
            Discover, interact and take your next step into the world of IT.
          </p>
        </div>

        <div className="cards">
          <article className="card">
            <div className="card-icon">
              <Monitor />
            </div>
            <span className="card-number">01</span>
            <h3>IT Exhibition</h3>
            <p>
              Explore technology demonstrations, student innovations, creative
              digital solutions and practical IT concepts. Discover how
              technology is shaping the modern world.
            </p>
            <div className="card-footer">
              DISCOVER TECHNOLOGY <ArrowRight size={16} />
            </div>
          </article>

          <article className="card">
            <div className="card-icon">
              <BriefcaseBusiness />
            </div>
            <span className="card-number">02</span>
            <h3>Career Guidance</h3>
            <p>
              Understand IT career pathways, learn about industry opportunities
              and gain useful direction for your educational and professional
              journey.
            </p>
            <div className="card-footer">
              BUILD YOUR FUTURE <ArrowRight size={16} />
            </div>
          </article>

          <article className="card">
            <div className="card-icon">
              <Network />
            </div>
            <span className="card-number">03</span>
            <h3>Connect & Grow</h3>
            <p>
              Meet fellow learners, exchange ideas, explore new interests and
              build meaningful connections with the IT community.
            </p>
            <div className="card-footer">
              MEET YOUR COMMUNITY <ArrowRight size={16} />
            </div>
          </article>
        </div>
      </section>

      {/* AUDIENCE */}
      <section className="section audience" id="audience">
        <div className="audience-copy">
          <span className="section-label">03 — WHO SHOULD JOIN</span>
          <h2>
            Your next chapter
            <br />
            could start <span className="gradient-text">here.</span>
          </h2>
          <p>
            NEXORA 2027 welcomes curious minds who are interested in technology,
            education, innovation and future career opportunities. You do not
            need to be an IT expert to take part.
          </p>
        </div>

        <div>
          <div className="audience-item">
            <div className="audience-icon">
              <GraduationCap />
            </div>
            <div>
              <b>School Leavers</b>
              <small>
                Discover educational pathways and opportunities in IT.
              </small>
            </div>
            <ArrowRight size={17} />
          </div>

          <div className="audience-item">
            <div className="audience-icon">
              <Users />
            </div>
            <div>
              <b>University Students</b>
              <small>
                Expand your knowledge and explore technology trends.
              </small>
            </div>
            <ArrowRight size={17} />
          </div>

          <div className="audience-item">
            <div className="audience-icon">
              <BriefcaseBusiness />
            </div>
            <div>
              <b>Freshers & Job Seekers</b>
              <small>Explore skills and possible career opportunities.</small>
            </div>
            <ArrowRight size={17} />
          </div>

          <div className="audience-item">
            <div className="audience-icon">
              <Laptop />
            </div>
            <div>
              <b>IT Enthusiasts</b>
              <small>
                Discover new ideas and connect with like-minded people.
              </small>
            </div>
            <ArrowRight size={17} />
          </div>
        </div>
      </section>

      {/* PROGRAMME */}
      <section className="section programme" id="programme">
        <div className="center">
          <span className="section-label">04 — EVENT PROGRAMME</span>
          <h2>
            One day. <span className="gradient-text">New possibilities.</span>
          </h2>
          <p>A day planned to help you explore technology and look ahead.</p>
        </div>

        <div className="programme-list">
          <div className="programme-item">
            <div className="programme-time">
              <Clock size={17} /> 09:00 AM – 11:30 AM
            </div>
            <div>
              <small>SESSION 01</small>
              <h3>IT Exhibition</h3>
              <p>
                Explore technology demonstrations, student innovations,
                practical IT concepts and digital solutions.
              </p>
            </div>
          </div>

          <div className="programme-item">
            <div className="programme-time">
              <Clock size={17} /> 12:00 PM – 04:00 PM
            </div>
            <div>
              <small>SESSION 02</small>
              <h3>Career Development Programme</h3>
              <p>
                Gain career insights, explore opportunities and receive guidance
                to help plan your future in the IT field.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ORGANISATION */}
      <section className="section organisers">
        <div className="center">
          <span className="section-label">05 — ORGANISATION</span>
          <h2>
            Driven by a vision.
            <br />
            <span className="gradient-text">Organised with purpose.</span>
          </h2>
          <p>
            NEXORA 2027 is brought together by the TVTC student community with
            the guidance of its instructor.
          </p>
        </div>

        <div className="organiser-card">
          <div className="organiser-detail">
            <div className="organiser-icon">
              <UserRound />
            </div>
            <div>
              <b>Event Organiser</b>
              <small>
                Mr. T. Dhinesh
                <br />
                ICTT Instructor
              </small>
            </div>
          </div>

          <div className="organiser-detail">
            <div className="organiser-icon">
              <Users />
            </div>
            <div>
              <b>Organising Committee</b>
              <small>
                TVTC Student Organising Committee
                <br />
                2024 First Batch through 2026 Second Batch
              </small>
            </div>
          </div>

          <div className="organiser-detail">
            <div className="organiser-icon">
              <Building2 />
            </div>
            <div>
              <b>Organising Institution</b>
              <small>Thondaman Vocational Training Centre (TVTC)</small>
            </div>
          </div>

          <div className="organiser-detail">
            <div className="organiser-icon">
              <Target />
            </div>
            <div>
              <b>Our Objective</b>
              <small>
                Inspire learners, introduce IT opportunities and encourage
                future-ready thinking.
              </small>
            </div>
          </div>
        </div>
      </section>

      {/* VENUE */}
      <section className="section" id="venue">
        <div className="venue-card">
          <div className="venue-info">
            <span className="section-label">06 — EVENT VENUE</span>
            <h2>
              Meet us at
              <br />
              <span className="gradient-text">TVTC.</span>
            </h2>
            <p>
              Be part of NEXORA 2027 at the Main Hall, New Building, Thondaman
              Vocational Training Centre. Join us for a day of technology
              exploration and career development.
            </p>

            <div className="venue-detail">
              <CalendarDays size={18} /> Tuesday, 19 January 2027
            </div>
            <div className="venue-detail">
              <MapPin size={18} /> Main Hall, New Building, TVTC
            </div>
            <div className="venue-detail">
              <Users size={18} /> Limited capacity: 250 participants
            </div>
          </div>

          <div className="venue-art">
            <div className="venue-symbol">
              <div style={{ textAlign: "center" }}>
                <Monitor size={48} />
                <span
                  style={{
                    display: "block",
                    marginTop: 12,
                    fontSize: 9,
                    letterSpacing: 2,
                    color: "white",
                  }}
                >
                  YOUR FUTURE
                  <br />
                  IN FOCUS
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* REGISTRATION CTA */}
      <section className="closing">
        <span className="section-label" style={{ color: "#b9b3ff" }}>
          THE NEXT CHAPTER STARTS WITH YOU
        </span>
        <h2>
          Think beyond.
          <br />
          <span className="gradient-text">Step into NEXORA.</span>
        </h2>
        <p>
          19 January 2027 · Thondaman Vocational Training Centre
          <br />
          Main Hall, New Building · Maximum capacity: 250 participants
        </p>

        <a href="/register" className="primary-btn">
          <Ticket size={17} /> Register as a Participant{" "}
          <ArrowRight size={18} />
        </a>
        <div className="register-note">
          <CheckCircle2
            size={13}
            style={{ verticalAlign: "middle", marginRight: 5 }}
          />
          Be part of the next generation of innovators.
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-brand">
          <img src="/nexora-logo.png" alt="NEXORA Logo" />
          <span>
            <strong>
              NEXORA <b>2027</b>
            </strong>
            <small style={{ display: "block", marginTop: 3 }}>
              EMPOWERING TOMORROW'S INNOVATORS
            </small>
          </span>
        </div>
        <span>© 2027 NEXORA. All rights reserved.</span>
      </footer>
    </div>
  );
}
