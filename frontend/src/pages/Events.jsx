import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fetchEvents } from "../utils/eventService";
import NextEventCountdown from "../components/events/NextEventCountdown";
import EventFilters from "../components/events/EventFilters";
import EventsList from "../components/events/EventsList";
import styled from "styled-components";
import "../styles/Hero.css";
import BackgroundParticles from "../components/BackgroundParticles";
import RegisterModal from "../components/RegisterForm";
import { useAuth } from "../contexts/useAuth";
const Section = styled.section`
  margin-top: 4rem;
  position: relative;
  overflow: hidden;
`;
const Container = styled.div`
  padding: 2rem 1rem 1rem 1rem;
  h2 {
    font-size: 2.25rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
    color: ${({ theme }) => theme.colors.text.primary};
    @media (min-width: 768px) {
      font-size: 3rem;
    }
  }
  .div1 {
    width: 5rem;
    height: 0.25rem;
    background-color: ${({ theme }) => theme.colors.primary.blue};
    margin: 1rem auto;
    p {
      font-size: 1.125rem; /* Equivalent to text-lg */
      color: ${({ theme }) =>
        theme.colors.text.secondary}; /* Equivalent to text-gray-700 */
      max-width: 42rem; /* Equivalent to max-w-2xl */
      margin: 0 auto; /* Equivalent to mx-auto */

      /* Dark mode styles */
      ${({ theme }) =>
        theme.name === "dark" &&
        `
    color: ${theme.colors.text.tertiary}; /* Equivalent to dark:text-gray-300 */
  `}
    }
  }
  .div2 {
    padding-left: 8rem;
    padding-right: 8rem;
    display: grid;
    grid-template-columns: 1fr; /* Equivalent to grid-cols-1 */
    gap: 2rem; /* Equivalent to gap-8 */
    margin-top: 3rem; /* Equivalent to mt-12 */

    @media (min-width: 1024px) {
      /* Equivalent to lg:grid-cols-3 */
      grid-template-columns: repeat(3, 1fr);
    }
    div {
      @media (min-width: 1024px) {
        /* Equivalent to lg:col-span-1 */
        grid-column: span 1 / span 1;
      }
    }
    @media (max-width: 768px) {
      padding-left: 3rem; /* Equivalent to pl-8 */
    }
    @media (max-width: 320px) {
      padding-left: 0rem; /* Equivalent to pl-4 */
    }
  }
`;
export default function Events() {
  const { activeEvent } = useAuth();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [activeFilter, setActiveFilter] = useState("upcoming");
  const [activeCategory, setActiveCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [close, setclose] = useState(true);
  const [currentevent, setCurrentEvent] = useState(activeEvent);

  const categories = [
    "All",
    "Workshop",
    "Confrence",
    "Hackathon",
    "Meetup",
    "Study Jam",
  ];

  useEffect(() => {
    const getEvents = async () => {
      setIsLoading(true);
      try {
        const data = await fetchEvents();
        setEvents(data);
        setFilteredEvents(data.filter((event) => event.status === "upcoming"));
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getEvents();
  }, []);
  useEffect(() => {
    setCurrentEvent(activeEvent);
  }, [activeEvent]);
  function handleClose() {
    setclose(true);
  }
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setFilteredEvents(events.filter((event) => event.status === filter));
  };

  const getNextEvent = () => {
    const upcomingEvents = events.filter(
      (event) => event.status === "upcoming",
    );
    if (upcomingEvents.length === 0) return null;

    // Sort by date and get the closest one
    return upcomingEvents.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )[0];
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
  };

  const nextEvent = getNextEvent();
  return (
    <>
      <BackgroundParticles />
      <Section id="events">
        <Container className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: "center", marginBottom: "2rem" }}
          >
            <h2>Upcoming &amp; Past Events</h2>
            <div className="div1"></div>
            <p>
              Join us at our events to learn, network, and grow with the Google
              Developer community at MMMUT.
            </p>
          </motion.div>

          <div className="div2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div style={{ position: "sticky", top: "6rem" }}>
                {nextEvent && (
                  <NextEventCountdown event={nextEvent} setclose={setclose} />
                )}

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 2, delay: 1.5 }}
                >
                  <div className="lg:h-[22rem] lg:w-[20rem] hidden lg:block">
                    <div className="hero-image">
                      <div className="rotating-cube">
                        <div className="cube-face front">G</div>
                        <div className="cube-face back">G</div>
                        <div className="cube-face right">D</div>
                        <div className="cube-face left">I/O</div>
                        <div className="cube-face top">DEV</div>
                        <div className="cube-face bottom">TECH</div>
                      </div>
                      {/* <img src={gdgGif} alt="GDG logo animation" /> */}
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              style={{ gridColumn: "span 2 / span 2" }}
            >
              <EventFilters
                activeFilter={activeFilter}
                activeCategory={activeCategory}
                onFilterChange={handleFilterChange}
                onCategoryChange={handleCategoryChange}
                categories={categories}
              />

              <EventsList
                events={filteredEvents}
                isLoading={isLoading}
                setclose={setclose}
              />
            </motion.div>
          </div>
        </Container>
      </Section>
      {!close && <RegisterModal event={currentevent} onClose={handleClose} />}
    </>
  );
}
