import { useState } from 'react';
import NextEventCountdown from '../components/events/NextEventCountdown';
import RegisterModal from '../components/RegisterForm';
import styled from 'styled-components';
import VerificationPage from '../components/Verification';


const EventsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.background.secondary};
  padding: 2rem;
  border-radius: 8px;

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    padding: 6rem;
    gap: 2rem;
  }
  @media(max-width:768px){
    gap: 2rem;
  }
`;

const ExploreButton = styled.button`
  display: block;
  margin: 2rem auto; /* Center the button horizontally */
  background-color: #3b82f6;
  color: white;
  font-weight: 600;
  font-size: 1rem;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #2563eb;
  }

  @media (min-width: 768px) {
    margin-top: 3rem;
  }
`;

const eventsData = [
  {
    id: '16',
    title: 'Induction 2026 – Your GDG Journey Begins',
    description: 'Join us for the GDG MMMUT Induction 2026! New members are welcomed into our vibrant tech community. Meet the team, discover upcoming events, and explore how you can learn, build, and collaborate with GDG On Campus MMMUT.',
    date: '2026-03-22T00:00:00+05:30',
    time: '12:00 AM',
    location: 'Online — GDG MMMUT',
    image: 'https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    status: 'upcoming',
    tags: ['Induction', 'Community', 'Networking', 'Tech'],
    attendees: 300,

    speakers: [
      {
        name: 'Dr. Aisha Kumar',
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        title: 'AI Research Lead, Google',
      },
      {
        name: 'Raj Patel',
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        title: 'Senior Android Developer',
      },
    ],
  },
];

export default function EventsSection() {
  const [close, setClose] = useState(true);
  const nextEvent = eventsData.find((event) => event.status === 'upcoming');

  function handleClose() {
    setClose(true);
  }

  return (
    <>
      <EventsWrapper>
        <VerificationPage />
        <NextEventCountdown event={nextEvent} setClose={setClose} />
      </EventsWrapper>

      <ExploreButton onClick={() => (window.location.href = '/events')}>Explore More</ExploreButton>

      {!close && <RegisterModal event={nextEvent} onClose={handleClose} />}
    </>
  );
}
