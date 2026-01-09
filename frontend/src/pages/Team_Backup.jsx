import { useEffect, useRef, useState } from 'react';
import styled, { useTheme } from 'styled-components';
import { motion, useInView, useScroll } from 'framer-motion';
import { FaGit, FaLinkedin, FaTwitter } from 'react-icons/fa';
import Uploadbox from '../../Upload/Uploadbox';
import { useAuth } from "../contexts/useAuth"
const TeamSectionContainer = styled.section`
  padding: 6rem 2rem;
  background-color: ${({ theme }) => theme.colors.background.primary};
  position: relative;
  overflow: hidden;
`;
const SectionContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;
const SectionHeader = styled.div`
  text-align: center;
  margin-bottom: 4rem;
`;
const SectionTitle = styled.h2`
  font-size: 2.5rem;
  margin-bottom: 1rem;
  position: relative;
  display: inline-block;
  &::after {
    content: '';
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    bottom: -0.5rem;
    height: 4px;
    width: 60px;
    background-color: ${({ theme }) => theme.colors.primary};
  }
`;
const SectionDescription = styled.p`
  font-size: 1.125rem;
  max-width: 700px;
  margin: 0 auto;
  color: ${({ theme }) => theme.colors.text.secondary};
`;
const TeamGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
`;
const TeamMemberCard = styled(motion.div)`
  background-color: ${({ theme }) => theme.colors.background.secondary};
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.6s ease;
  height: ${({ $isLead }) => $isLead ? '400px' : '450px'};
  display: flex;
  flex-direction: column;
  &:hover {
    transform: translateY(-8px);
  }
`;
const MemberImage = styled.div`
  height: 250px;
  overflow: hidden;
  position: relative;
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 50%;
    background: linear-gradient(
      to bottom,
      transparent,
      ${({ theme }) => theme.colors.background.secondary}
    );
  }
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
    transition: transform 0.75s ease;
    will-change: transform;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    transform: translateZ(0);
    -webkit-transform: translateZ(0);
  }
  ${TeamMemberCard}:hover & img {
    transform: scale(1.05);
  }
`;
const MemberContent = styled.div`
  padding: 1.5rem;
  text-align: center;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const RoleBadge = styled.span`
  display: inline-block;
  background-color: ${({ theme, $role }) => {
    switch ($role) {
      case 'lead': return theme.googleColors.blue.light;
      case 'core': return theme.googleColors.red.light;
      case 'organizer': return theme.googleColors.green.light;
      case 'volunteer': return theme.googleColors.yellow.light;
      default: return theme.colors.primary;
    }
  }};
  color: ${({ theme, $role }) => {
    switch ($role) {
      case 'lead': return theme.googleColors.blue.darker;
      case 'core': return theme.googleColors.red.darker;
      case 'organizer': return theme.googleColors.green.darker;
      case 'volunteer': return theme.googleColors.yellow.darker;
      default: return theme.colors.text.inverse;
    }
  }};
  padding: 0.25rem 0.75rem;
  border-radius: 50px;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.75rem;
`;
const MemberName = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: ${({ theme }) => theme.colors.text.primary};
`;
const MemberRole = styled.h4`
  font-size: 1.125rem;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.primary};
`;
const SocialLinks = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
`;
const SocialLink = styled(motion.a)`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 1.25rem;
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;
const FilterButton = styled.button`
  padding: 10px 20px;
  border-radius: 25px;
  // border: 2px solid ${props => props.theme.primary};
  background: ${props => props.active 
    ? props.theme.primary 
    : (props.theme.name === 'dark' ? '#2b2b2b9c' : '#e7e5e5bf')};
  color: ${props => props.active ? 'white' : props.theme.colors.text.primary};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.theme.primary};
    color: white;
  }
`;
const FilterContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 40px;
  flex-wrap: wrap;
`;

// Dummy team data
const teamData = [
  {
    "id": 1,
    "name": "Avanish Upadhyay",
    "role": "Web Dev Team",
    "badge": "Web Developer",
    "year": "2024",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759052268/Screenshot_2025-09-28_150718_giend7.png",
    "social": {
      "linkedin": "https://www.linkedin.com/in/avanish633/",
      "twitter": "https://x.com/AvanishU1807",
      "github": "https://github.com/itsmeavanish"
    }
  },
  
  {
    "id": 2,
    "name": "Aditya Pratap Singh",
    "role": "Web Dev Team",
    "badge": "Web Developer",
    "year": "2024",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQEa89vnpYSKzg/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1723404895368?e=1757548800&v=beta&t=aOn0H36gOZyAc-MaRTbdu5pdlENlcoXqyZ9SV7zyPDM",
    "social": {
      "linkedin": "https://www.linkedin.com/in/aditya-pratap-singh27/",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },

  {
    "id": 3,
    "name": "Ujjwal Gupta",
    "role": "Web Dev Team",
    "badge": "Web Developer",
    "year": "2024",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759053952/ujjwal_sir_mbg2se.png",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  {
    "id": 4,
    "name": "Anmol Tomar",
    "role": "Web Dev Team",
    "badge": "Web Developer",
    "year": "2024",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759054318/anmol_mintp3.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  
  {
    "id": 6,
    "name": "Vikhyat Singh",
    "role": "Android Dev Team",
    "badge": "Android Developer",
    "year": "2024",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759061340/vikhyat_sir_ac0kp5.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  {
    "id": 7,
    "name": "Vivek Maurya",
    "role": "Android Dev Team",
    "badge": "Android Developer",
    "year": "2024",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759069603/vivek_wtoijd.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  {
    "id": 5,
    "name": "Saksham Mishra",
    "role": "Android Dev Team",
    "badge": "Android Developer",
    "year": "2024",
    "image": "https://res.cloudinary.com/dsvnqnvt7/image/upload/v1759056016/saksham_sir_rmomui.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  {
    "id": 8,
    "name": "Anurag Yadav",
    "role": "Design Team",
    "badge": "Designer",
    "year": "2024",
    "image": "https://res.cloudinary.com/dsvnqnvt7/image/upload/v1759056984/Screenshot_2025-09-28_162518_bqe93l.png",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  {
    "id": 10,
    "name": "Madhu Yadav",
    "role": "Design Team",
    "badge": "Designer",
    "year": "2024",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759068837/madhu_k2w73o.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  {
    "id": 11,
    "name": "Prateek Khare",
    "role": "Design Team",
    "badge": "Designer",
    "year": "2024",
    "image": "https://res.cloudinary.com/dsvnqnvt7/image/upload/v1759058503/prateek_sir_s047ei.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  {
    "id": 12,
    "name": "Harshit Singh",
    "role": "DSA/CP Team",
    "badge": "Competitive Programmer",
    "year": "2024",
    "image": "https://res.cloudinary.com/dsvnqnvt7/image/upload/v1759058729/Screenshot_2025-09-28_165412_klktgc.png",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  {
    "id": 13,
    "name": "Shivam Singh",
    "role": "DSA/CP Team",
    "badge": "Competitive Programmer",
    "year": "2024",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759068970/shivam_scb6qq.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  {
    "id": 14,
    "name": "Kriti Yadav",
    "role": "DSA/CP Team",
    "badge": "Competitive Programmer",
    "year": "2024",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759077821/kriti_z2nrro.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  {
    "id": 15,
    "name": "Kunal Shrivastav",
    "role": "DSA/CP Team",
    "badge": "Competitive Programmer",
    "year": "2024",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759060557/kunal_an6muy.png",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  {
    "id": 16,
    "name": "Ananya Gupta",
    "role": "Content & Management Team",
    "badge": "Content Creator",
    "year": "2024",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQHSeE_4U6GRrg/profile-displayphoto-shrink_800_800/B56ZOhcq0SGwAc-/0/1733580480295?e=1757548800&v=beta&t=EcvAhwC6cagz-NWne_bt4dOX-ujwoAn-VZTrenrVZuM",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  {
    "id": 17,
    "name": "Ananya",
    "role": "Content & Management Team",
    "badge": "Content Creator",
    "year": "2024",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759078304/ananya_ei3pwx.png",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  {
    "id": 18,
    "name": "Ashutosh Maurya",
    "role": "Content & Management Team",
    "badge": "Content Creator",
    "year": "2024",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759078441/ashutosh_boekul.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  {
    "id": 19,
    "name": "Atishay Kumar Pandey",
    "role": "Content & Management Team",
    "badge": "Content Creator",
    "year": "2024",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759078528/atishay_qrls62.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  {
    "id": 20,
    "name": "Jahnawi Agarwal",
    "role": "Content & Management Team",
    "badge": "Content Creator",
    "year": "2024",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759078577/jahnavi_kd1kau.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  {
    "id": 82,
    "name": "Riya Verma",
    "role": "AI/ML Team",
    "badge": "AI/ML Developer",
    "year": "2024",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759078683/riya_ffqhox.jpg",
    "social": {
      "linkedin": "https://www.linkedin.com/in/riya-verma-28b461289/",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  {
    "id": 83,
    "name": "Snehil Saxena",
    "role": "AI/ML Team",
    "badge": "AI/ML Developer",
    "year": "2024",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759078783/snehil_hdflcr.jpg",
    "social": {
      "linkedin": "https://www.linkedin.com/in/snehil-saxena-b541a4264/",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  {
    "id": 84,
    "name": "Abhay Chauhan",
    "role": "AI/ML Team",
    "badge": "AI/ML Developer",
    "year": "2024",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759078874/ahay_g4zblh.png",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  // 2025 Team Members
  {
    "id": 100,
    "name": "Shaurya Srivastava",
    "role": "Content & Management Team",
    "badge": "Content Creator",
    "year": "2025",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759079904/meside_okwmn0.jpg",
    "social": {
      "linkedin": "https://www.linkedin.com/in/shaurya-srivastava/",
      "twitter": "https://twitter.com/shaurya_sriv",
      "github": "https://github.com/shaurya-srivastava"
    }
  },
  {
    "id": 101,
    "name": "Abhi Aryan",
  "role": " UI/UX Team",
    "badge": "Designer",
    "year": "2025",
    "image": "https://res.cloudinary.com/dsvnqnvt7/image/upload/v1760638728/IMG-20251008-WA0011_dw9iz4.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  {
    "id": 102,
    "name": "Aradhya Singh",
    "role": "Content & Management Team",
    "badge": "Content Creator",
    "year": "2025",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759083620/aradhya_m6kxlm.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  {
    "id": 103,
    "name": "Shreya Tiwari",
    "role": "AI/ML & Cyber Security Team",
    "badge": "AI/ML Developer",
    "year": "2025",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759124587/shreya_py0wij.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  {
    "id": 104,
    "name": "Saloni Verma",
    "role": "UI/UX Team",
    "badge": "Designer",
    "year": "2025",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759081658/saloni_ws4xib.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  {
    "id": 105,
    "name": "Vikas Chaurasia",
    "role": "Content & Management Team",
    "badge": "Content Creator",
    "year": "2025",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759081404/vikas_l8j7y0.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  {
    "id": 106,
    "name": "Priyanshu Chausasia",
    "role": "Web Dev Team",
    "badge": "Web Developer",
    "year": "2025",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759081939/priyanshu_z6mrpn.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  {
    "id": 107,
    "name": "Shubham Yadav",
    "role": "Content & Management Team",
    "badge": "Content Creator",
    "year": "2025",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759082067/shubham_z7xcm5.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  {
    "id": 108,
    "name": "Manish Gupta",
    "role": "DSA/CP Team",
    "badge": "Competitive Developer",
    "year": "2025",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759082390/manish_gnzoip.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  {
    "id": 109,
    "name": "Saharsh Vijay Singh",
    "role": "UI/UX Team",
    "badge": "Designer",
    "year": "2025",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759082702/saharsh_ttcvvi.png",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  {
    "id": 110,
    "name": "Darshika Bhaskar",
    "role": "Content & Management Team",
    "badge": "Content Creator",
    "year": "2025",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759083507/darshika_ftogro.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  {
    "id": 111,
    "name": "Adhrav Rai",
    "role": "AI/ML & Cyber Security Team",
    "badge": "AI/ML Developer",
    "year": "2025",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759126822/adarak_eutpfj.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  {
    "id": 112,
    "name": "Samriddhi Shree",
    "role": "AI/ML Team",
    "badge": "AI/ML Developer",
    "year": "2025",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759137457/samriddhi_d92w3g.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  {
    "id": 113,
    "name": "Nikhil Yadav",
    "role": "Web Dev Team",
    "badge": "Web Developer",
    "year": "2025",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759137463/nikhi_jc6hur.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  {
    "id": 114,
    "name": "Aditi Pandey",
    "role": "Android Dev Team",
    "badge": "Android Developer",
    "year": "2025",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759137695/aditi_ojocnm.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  {
    "id": 115,
    "name": "Soumya Gupta",
    "role": "Design Team",
    "badge": "Designer",
    "year": "2025",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759137467/soumya_emhsn0.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  {
    "id": 125,
    "name": "Ananya Yadav",
    "role": "UI/UX Team",
    "badge": "Designer",
    "year": "2025",
    "image": "https://res.cloudinary.com/dsvnqnvt7/image/upload/v1759158292/Ananya_Yadav_ajfa7s.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  {
    "id": 116,
    "name": "Rasshi Ashish Khan",
    "role": "DSA/CP Team",
    "badge": "Competitive Programmer",
    "year": "2025",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759154024/rasshi_njbwl6.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  {
    "id": 117,
    "name": "Durgesh Gupta",
    "role": "Content & Management Team",
    "badge": "Content Creator",
    "year": "2025",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759153913/durgesh_bxpu9s.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  {
    "id": 118,
    "name": "Dheeraj Yadav",
    "role": "AI/ML Team",
    "badge": "AI/ML Developer",
    "year": "2025",
    "image": "https://res.cloudinary.com/dsvnqnvt7/image/upload/v1759159004/IMG_20250915_192641_-_Dheeraj_YADAV_arivuy.png",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  {
    "id": 119,
    "name": "Anchal Patel",
    "role": " Web Dev Team",
    "badge": "Web Developer",
    "year": "2025",
    "image": "https://res.cloudinary.com/dsvnqnvt7/image/upload/v1759158291/Anchal_Patel_jz7mzf.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  {
    "id": 120,
    "name": "Bhoomi Srivastava",
    "role": "UI/UX Team",
    "badge": "Designer",
    "year": "2025",
    "image": "https://res.cloudinary.com/dsvnqnvt7/image/upload/v1759165687/bhoomi_isgc7f.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  {
    "id": 121,
    "name": "Aman Kumar",
    "role": "DSA/CP Team",
    "badge": "Competitive Programmer",
    "year": "2025",
    "image": "https://res.cloudinary.com/dsvnqnvt7/image/upload/v1759159139/Picsart_25-07-01_23-23-15-094_-_Aman_Kumar_imtdmy.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  {
    "id": 122,
    "name": "Ayush Dubey",
    "role": "Content & Management Team",
    "badge": "Content Creator",
    "year": "2025",
    "image": "https://res.cloudinary.com/dsvnqnvt7/image/upload/v1759158955/IMG63829291UE73_-_Ayush_Dubey_nvw1gk.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  
  {
    "id": 123,
    "name": "Himanshi Singh",
    "role": "Content & Management Team",
    "badge": "Content Creator",
    "year": "2025",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759158154/himanshi_wzj8jq.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  {
    "id": 124,
    "name": "Amitesh Vishwakarma",
    "role": "AI/ML Team",
    "badge": "AI/ML Developer",
    "year": "2025",
    "image": "https://res.cloudinary.com/dsvnqnvt7/image/upload/v1759158822/IMG-20250915-WA0043_-_Amitesh_Vishwakarma_mw8bli.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    }
  },
  {
    "id": 200,
    "name": "Vikhyat Singh",
    "role": "GDG Lead 2025-26",
    "position": "GDG Lead",
    "badge": "Tech Lead",
    "year": "Leads",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759061340/vikhyat_sir_ac0kp5.jpg",
    "social": {
      "linkedin": "https://www.linkedin.com/in/vikhyat-singh/",
      "twitter": "https://twitter.com/vikhyat_singh",
      "github": "https://github.com/vikhyat-singh"
    }
  },
  {
    "id": 30,
    "name": "Aastha Gupta",
    "role": "GDG Lead 2024-25",
    "position": "GDG Lead",
    "badge": "Android Developer",
    "year": "2023",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759052014/Aastha_Gupta_maam_uroyki.jpg",
    "social": {
      "linkedin": "https://www.linkedin.com/in/aastha5/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 36,
    "name": "Avinash Mishra",
    "role": "GDG Co-lead 2024-25",
    "badge": "Content Creator",
    "year": "2023",
    "image": "https://www.linkedin.com/dms/prv/image/v2/D5606AQEt9NHToDRKiQ/messaging-image-720/B56ZiJFVQvH0Ag-/0/1754646533804?m=AQKr-6e5kqoZOAAAAZiJFWN-Qf0OfLi4IsgTonbD7y-BQijYuXDobuN_WuM&ne=1&v=beta&t=MyzPop_byeXdJTqZhA1dWWug5jABnN0dtCH_6qeWweI",
    "social": {
      "linkedin": "https://www.linkedin.com/in/avinash-m-321128283/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 21,
    "name": "Madhur Pratap Singh Gaur",
    "role": "Web & Firebase Team",
    "badge": "Web Developer",
    "year": "2023",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQGkEqGr3-BnRQ/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1718821349966?e=1757548800&v=beta&t=3eubEjrzfO9m8m1YUxAMPrBwbT3OSQIQ7TNVtlFrXG0",
    "social": {
      "linkedin": "https://www.linkedin.com/in/abhay-chauhan29/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 22,
    "name": "Sandeep Singh (ECE)",
    "role": "Web & Firebase Team",
    "badge": "Web Developer",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQE5rv-CkbJsdQ/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1729936991258?e=1757548800&v=beta&t=8-lFWJpZLP_8E_wPkvh5t7XgsVzgcYZNRq6Dfcpss6o",
    "year": "2023",
    "social": {
      "linkedin": "https://www.linkedin.com/in/sandeep-singh-445058254/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 23,
    "name": "Aditya Gaur",
    "role": "Web & Firebase Team",
    "badge": "Web Developer",
    "year": "2023",
    "image": "https://www.linkedin.com/dms/prv/image/v2/D5606AQE4cFA7xQK4Jw/messaging-image-720/B56ZiJNO1zG4AY-/0/1754648605252?m=AQKkCZYWoajXWAAAAZiJUngaL0O7lF1pkWe9jHyyc-nzYE-0P8AUJxeSMIo&ne=1&v=beta&t=l9AJsfHxnoTt2ORxfbh9ZcHXalX_-P4VP-QNMcMdOQ4",
    "social": {
      "linkedin": "",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 24,
    "name": "Pranjal Mani",
    "role": "Web & Firebase Team",
    "badge": "Web Developer",
    "year": "2023",
    "image": "",
    "social": {
      "linkedin": "",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 25,
    "name": "Jyoti Maurya",
    "role": "Web & Firebase Team",
    "badge": "Web Developer",
    "year": "2023",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQGP-DzNw3se7A/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1727194174971?e=1757548800&v=beta&t=zKZzsVM69LRrvqjzP51OoRZA70rkC7l9zwDh3Q10QAA",
    "social": {
      "linkedin": "https://www.linkedin.com/in/jyoti-maurya-b9a5b8255/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 26,
    "name": "Gayetri Verma",
    "role": "AI/ML, Cybersecurity & Cloud Team",
    "badge": "AI/ML Enthusiast",
    "year": "2023",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQHKk0n9cvBUCw/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1715702111001?e=1757548800&v=beta&t=1z-qa_dBanL9EryhBCkcjhre2pUXFP8oPubiGoXe0vg",
    "social": {
      "linkedin": "https://www.linkedin.com/in/-gayatri-/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 27,
    "name": "Aditya Patel",
    "role": "AI/ML, Cybersecurity & Cloud Team",
    "badge": "AI/ML Enthusiast",
    "year": "2023",
    "image": "",
    "social": {
      "linkedin": "https://www.linkedin.com/in/sayaditya/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 28,
    "name": "Sarika Kaushal",
    "role": "AI/ML, Cybersecurity & Cloud Team",
    "badge": "AI/ML Enthusiast",
    "year": "2023",
    "image": "",
    "social": {
      "linkedin": "https://www.linkedin.com/in/sarika-kaushal-192a92283/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 29,
    "name": "Aditya Kumar Kasaudhan",
    "role": "Android Team",
    "badge": "Android Developer",
    "year": "2023",
    "image": "https://media.licdn.com/dms/image/v2/D4E03AQFuE_3M_VJg6w/profile-displayphoto-shrink_800_800/B4EZcdE0DJG4Ag-/0/1748539492257?e=1757548800&v=beta&t=PT_9UF7b4cWbmOnv3LJWNvw3g2-NHXb_TtXclCMcr0g",
    "social": {
      "linkedin": "https://www.linkedin.com/in/aditya-kumar-8a8a51326/",
      "twitter": "",
      "github": ""
    }
  },
  
  {
    "id": 31,
    "name": "Suraj Kasaudhan",
    "role": "Android Team",
    "badge": "Android Developer",
    "year": "2023",
    "image": "",
    "social": {
      "linkedin": "https://www.linkedin.com/in/suraj-kasaudhan-ks/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 32,
    "name": "Sandeep Singh (ECE)",
    "role": "Android Team",
    "badge": "Android Developer",
    "year": "2023",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQGhTq9LehoOAQ/profile-displayphoto-shrink_400_400/B56ZUjUVFPGsAg-/0/1740054287396?e=1757548800&v=beta&t=J0qOBfMYam5QmcL4BhUeJqKFokFonxnafn4Ve2TV1L0",
    "social": {
      "linkedin": "",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 33,
    "name": "Ritika Yadav",
    "role": "Graphics & Creativity Team",
    "badge": "Designer",
    "year": "2023",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQHZcUj2G8J7kg/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1730605545388?e=1757548800&v=beta&t=1Iz_cDZC6Ko7VGJK5ZnxuwKeVCCWwG_B5udwwOsNB84",
    "social": {
      "linkedin": "https://www.linkedin.com/in/ritika-yadav-933052258/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 34,
    "name": "Divyansh Gupta",
    "role": "Graphics & Creativity Team",
    "badge": "Designer",
    "year": "2023",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQGL1YeL5n6CEw/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1725198795892?e=1757548800&v=beta&t=McCk0JmAxwzYscvXwKHC9-HjsOfqJseoaNoQ09q5F28",
    "social": {
      "linkedin": "https://www.linkedin.com/in/divyansh-gupta-0ab55b258/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 35,
    "name": "Tanya Batham",
    "role": "Content Team",
    "badge": "Content Creator",
    "year": "2023",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQHp4DQEc76QGg/profile-displayphoto-crop_800_800/B56Zg2hfwoHUAI-/0/1753261409085?e=1757548800&v=beta&t=lIVjtgmBe52fsfUB14ZsmP_QVUnULMl6ErP01sFWtHE",
    "social": {
      "linkedin": "https://www.linkedin.com/in/tanya-batham-69604724b/",
      "twitter": "",
      "github": ""
    }
  },
  
  {
    "id": 37,
    "name": "Abhinav Kumar",
    "role": "Event Coordination & Sponsorship Team",
    "badge": "Event Coordinator",
    "year": "2023",
    "image": "https://media.licdn.com/dms/image/v2/D4D03AQE84vntBLlVIg/profile-displayphoto-shrink_800_800/B4DZS4SkqwG8Ag-/0/1738258665409?e=1757548800&v=beta&t=Q3goUs_Fr9Mu4xrrEWPoMk_ng6Eyh7ngyuh4BMA38Nk",
    "social": {
      "linkedin": "https://www.linkedin.com/in/abhinav-kumar-a98b96333/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 38,
    "name": "Nainsi Gupta",
    "role": "Event Coordination & Sponsorship Team",
    "badge": "Event Coordinator",
    "year": "2023",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQHuGUBpCjY43g/profile-displayphoto-shrink_800_800/B56Zb93TRcHgAg-/0/1748015860669?e=1757548800&v=beta&t=b3rqh4HnfMlJg5jit5Xl10vbFLqGlLKpZn9bK7Then4",
    "social": {
      "linkedin": "https://www.linkedin.com/in/nainsi-gupta-549488258/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 39,
    "name": "Abhirup Pratap Chaurasiya",
    "role": "Event Coordination & Sponsorship Team",
    "badge": "Event Coordinator",
    "year": "2023",
    "image": "",
    "social": {
      "linkedin": "",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 40,
    "name": "Paridhi Mittal",
    "role": "Event Coordination & Sponsorship Team",
    "badge": "Event Coordinator",
    "year": "2023",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQGUN9saFbCaTg/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1726507968764?e=1757548800&v=beta&t=eCZYCR7abVlB5HE79yMTxLrRw2aR-I3iAoAVvTnXsMc",
    "social": {
      "linkedin": "https://www.linkedin.com/in/paridhi-mittal-64bb94251/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 41,
    "name": "Anuj Kashyap",
    "role": "Event Coordination & Sponsorship Team",
    "badge": "Event Coordinator",
    "year": "2023",
    "image": "",
    "social": {
      "linkedin": "",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 42,
    "name": "Aastha Singh Sachan",
    "role": "Web & Firebase Team",
    "badge": "Web Developer",
    "year": "2022",
    "image": "",
    "social": {
      "linkedin": "",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 43,
    "name": "Abhishek Yadav",
    "role": "Web & Firebase Team",
    "badge": "Web Developer",
    "year": "2022",
    "image": "https://media.licdn.com/dms/image/v2/C4D03AQHL7RnuSeWLgA/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1655254741573?e=1757548800&v=beta&t=EdqHpbc31F0Mhc_BIaKkHN8jIAP-nvAqQURp5upWZ4Q",
    "social": {
      "linkedin": "https://www.linkedin.com/in/abhishekcpr/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 44,
    "name": "Madhur Vatsal Bharti",
    "role": "Web & Firebase Team",
    "badge": "Web Developer",
    "year": "2022",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQHbYlZeM5nlzQ/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1711076389936?e=1757548800&v=beta&t=5QSFUdsem9wIHdnJtaX80xsT63UMmQgGN1uJYb_PdrI",
    "social": {
      "linkedin": "https://www.linkedin.com/in/madhur-vatsal/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 45,
    "name": "Saurabh Singh",
    "role": "Web & Firebase Team",
    "badge": "Web Developer",
    "year": "2022",
    "image": "https://media.licdn.com/dms/image/v2/C4E03AQEWd-zAjJpTKw/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1627226363660?e=1757548800&v=beta&t=wKZbBldujhUqv8lnmwpNFjxNBiNHK8MeQHYYicxumCo",
    "social": {
      "linkedin": "https://www.linkedin.com/in/saurabh-singh-9ab614218/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 46,
    "name": "Sonali Rao",
    "role": "Web & Firebase Team",
    "badge": "Web Developer",
    "year": "2022",
    "image": "https://media.licdn.com/dms/image/v2/D4D03AQHJZxwENs8RnA/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1693191735474?e=1757548800&v=beta&t=A1HBx-N9uuHeRJYNx_QIdCsXjGcGbwzWTsA5V3BLQs4",
    "social": {
      "linkedin": "https://www.linkedin.com/in/sonali-rao-25b095228/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 47,
    "name": "Anubhav Gupta",
    "role": "GDSC Lead 2023-24",
    "position": "GDG Lead",
    "badge": "AI/ML Enthusiast",
    "year": "2022",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759042809/Anubhav_Gupta_Sir.jpeg_r2anbo.jpg",
    "social": {
      "linkedin": "https://www.linkedin.com/in/anubhavgupta14/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 48,
    "name": "Ritika Agrahari",
    "role": "AI/ML & Cybersecurity Team",
    "badge": "AI/ML Enthusiast",
    "year": "2022",
    "image": "",
    "social": {
      "linkedin": "https://www.linkedin.com/in/ritika-agrahari-938278230/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 49,
    "name": "Satvik Tripathi",
    "role": "AI/ML & Cybersecurity Team",
    "badge": "AI/ML Enthusiast",
    "year": "2022",
    "image": "https://media.licdn.com/dms/image/v2/D4D03AQGTCwvAbM0RwQ/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1672751241929?e=1757548800&v=beta&t=PY-LLXojwdf2e8_53va3XEKVpVQPVSCtIqWO9gCG5Us",
    "social": {
      "linkedin": "https://www.linkedin.com/in/satvik-tripathi-3b6579237/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 50,
    "name": "Ankit Verma",
    "role": "Android Team",
    "badge": "Android Developer",
    "year": "2022",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQEpJTCSbCaWxA/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1708697064823?e=1757548800&v=beta&t=a9tbI86ZO78b9bYgieOfGKXFxSDEcF-R66AeXrn43hU",
    "social": {
      "linkedin": "https://www.linkedin.com/in/ankit11verma/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 51,
    "name": "Devansh Tripathi",
    "role": "Android Team",
    "badge": "Android Developer",
    "year": "2022",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQEIBG9rQb0r7w/profile-displayphoto-shrink_800_800/B56ZT9g2YuHsAs-/0/1739420037396?e=1757548800&v=beta&t=_pr2UdYB9TjIOeP178beYPqqkAhVJ04_T7XnHcs_zOc",
    "social": {
      "linkedin": "https://www.linkedin.com/in/devansh-tripathi-4150aa225/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 52,
    "name": "Sarthak Vishwakarma",
    "role": "Android Team",
    "badge": "Android Developer",
    "year": "2022",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQFYYBEkxwJ_4Q/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1731478767702?e=1757548800&v=beta&t=InJmkJaEXc0tHyHuteQ114ObCjPofC3IJzjvSxrYKFw",
    "social": {
      "linkedin": "https://www.linkedin.com/in/hellosarthak/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 53,
    "name": "Aniket Chaudhary",
    "role": "Graphics & Creativity Team",
    "badge": "Designer",
    "year": "2022",
    "image": "https://media.licdn.com/dms/image/v2/D4D03AQFYaQcuOPRB8Q/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1699551727970?e=1757548800&v=beta&t=6-a6Xn5bZm6vN7eGd8wTc-k6YOgsFYT-pWfoZKJS9vY",
    "social": {
      "linkedin": "https://www.linkedin.com/in/aniket-chaudhary98/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 54,
    "name": "Atul Kumar",
    "role": "Graphics & Creativity Team",
    "badge": "Designer",
    "year": "2022",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQFlj-Se27nypw/profile-displayphoto-shrink_800_800/B56ZY7ZeGEGsAc-/0/1744753255735?e=1757548800&v=beta&t=VIpifpUSF7bOpdQ_Ddo9vMUOJyzwCk6i_4B8PDQU7CE",
    "social": {
      "linkedin": "https://www.linkedin.com/in/atul1510/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 55,
    "name": "Sumit Kumar",
    "role": "Graphics & Creativity Team",
    "badge": "Designer",
    "year": "2022",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQHAKOzv7o18HQ/profile-displayphoto-shrink_800_800/B56ZbTwjQDGsAk-/0/1747309452855?e=1757548800&v=beta&t=Jsi5TXbIQSuqq4Ns4Wmp3EfBPvWjNRHx3S_MAIoYdXg",
    "social": {
      "linkedin": "https://www.linkedin.com/in/sumit-kumar-bbb38b230/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 56,
    "name": "Anam Kumar Tiwari",
    "role": "Content Team",
    "badge": "Content Creator",
    "year": "2022",
    "image": "",
    "social": {
      "linkedin": "",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 57,
    "name": "Gaurav Kumar Sen",
    "role": "Content Team",
    "badge": "Content Creator",
    "year": "2022",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQFKXRFih3MQLg/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1718230778246?e=1757548800&v=beta&t=lj5OF_hKod3YhYsLmjviv4Op-Bknv40WFI8JfCZLYtM",
    "social": {
      "linkedin": "https://www.linkedin.com/in/gaurav-kumar-sen-317093228/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 58,
    "name": "Saemvi Gupta",
    "role": "Content Team",
    "badge": "Content Creator",
    "year": "2022",
    "image": "",
    "social": {
      "linkedin": "",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 59,
    "name": "Ajit Kumar Yadav",
    "role": "Marketing & Sponsorship Team",
    "badge": "Marketing Specialist",
    "year": "2022",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQEvUYOgsMiRTw/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1677778037357?e=1757548800&v=beta&t=v4Neb0KDY3FUPuNq3nI9jugdrLtYOyQEJbce0xMbngQ",
    "social": {
      "linkedin": "https://www.linkedin.com/in/ajityaduv/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 60,
    "name": "Atulya Vaibhav Pandey",
    "role": "Marketing & Sponsorship Team",
    "badge": "Marketing Specialist",
    "year": "2022",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQH6zEmlIQPMOQ/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1720977519964?e=1757548800&v=beta&t=qFK5_5tEBkFaifzfcjF669--o4bgPK6gNFaH2pUmcWw",
    "social": {
      "linkedin": "https://www.linkedin.com/in/atulya-vaibhav-pandey/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 61,
    "name": "Yogeshwar Gupta",
    "role": "Marketing & Sponsorship Team",
    "badge": "Marketing Specialist",
    "year": "2022",
    "image": "https://media.licdn.com/dms/image/v2/D4D03AQFdWNkaqIgOjw/profile-displayphoto-shrink_800_800/B4DZZsoMBxHwAc-/0/1745579197553?e=1757548800&v=beta&t=XHyclTeOpzCbJPDoe33TBojTn-bMbLYpI2lCth_q-Ws",
    "social": {
      "linkedin": "https://www.linkedin.com/in/yogeshwarg/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 62,
    "name": "Aniket Gupta",
    "role": "Event Coordination Team",
    "badge": "Event Coordinator",
    "year": "2022",
    "image": "",
    "social": {
      "linkedin": "https://www.linkedin.com/in/aniket310/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 63,
    "name": "Anjali Gupta",
    "role": "Event Coordination Team",
    "badge": "Event Coordinator",
    "year": "2022",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQGd9qxeIZspxQ/profile-displayphoto-shrink_800_800/B56Zc_15Q3HUAg-/0/1749122783656?e=1757548800&v=beta&t=AFMJcHFjSWifZIyHGp3cOoKZeiUCchdquszp3JfWwnU",
    "social": {
      "linkedin": "https://www.linkedin.com/in/anjali-gupta2004/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 64,
    "name": "Ishita Shukla",
    "role": "Event Coordination Team",
    "badge": "Event Coordinator",
    "year": "2022",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQE03LlGCHdhrg/profile-displayphoto-shrink_800_800/B56ZTVSeVzHsAk-/0/1738745179642?e=1757548800&v=beta&t=7nKl6xK0-7tS63zLDgJvGIVCkxWdq3emgVPtYfYnCiI",
    "social": {
      "linkedin": "https://www.linkedin.com/in/ishita20/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 65,
    "name": "Abhay Nandan Singh",
    "role": "Media and CP Executive",
    "badge": "Media Coordinator",
    "year": "2021",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQFQecvBCDalQA/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1722880310070?e=1757548800&v=beta&t=P3It9AtAFa8qZLI7nf9G_ihET6fjPWYcLOvwoCqLnEU",
    "social": {
      "linkedin": "https://www.linkedin.com/in/deltath/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 66,
    "name": "Archana Chaurasiya",
    "role": "Media and CP Executive",
    "badge": "Content Creator",
    "year": "2021",
    "image": "https://media.licdn.com/dms/image/v2/C5603AQGw-kZyDpjF-Q/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1629031913867?e=1757548800&v=beta&t=jRmW1QJ2IqZmgcZcuBF0HBPj73qPltzfD30k9HfTPFE",
    "social": {
      "linkedin": "http://linkedin.com/in/archana-chaurasiya-4507bb182/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 67,
    "name": "Aradhya Srivastav",
    "role": "Media and CP Executive",
    "badge": "Public Relations",
    "year": "2021",
    "image": "",
    "social": {
      "linkedin": "https://www.linkedin.com/in/aradhya08oc01/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 68,
    "name": "Anubhav Aggrawal",
    "role": "Media and CP Executive",
    "badge": "Social Media Manager",
    "year": "2021",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQGNok1iff1LVA/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1725382143110?e=1757548800&v=beta&t=sRg9CUSyTi6R-87hq-hCiKjR-Rz03JrKD6-pXZc3WOE",
    "social": {
      "linkedin": "https://www.linkedin.com/in/anubhav-agrawal-766b23203/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 69,
    "name": "Bhaskar Trivedi",
    "role": "GDSC Lead 2022-23",
    "position": "GDG Lead",
    "badge": "Event Coordinator",
    "year": "2021",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759042667/Bhaskar_Trivedi_Sir.jpeg_cyjjis.jpg",
    "social": {
      "linkedin": "https://www.linkedin.com/in/bhaskart488/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 70,
    "name": "Aman Kumar Sonkar",
    "role": "Web, App, and Project Development Executive",
    "badge": "Developer",
    "year": "2021",
    "image": "https://media.licdn.com/dms/image/v2/D4D03AQHcnH85mDBoXw/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1704220429057?e=1757548800&v=beta&t=JpaSeRciklAlqlmy4A60doEeNziPlRInyPNG4AiY4og",
    "social": {
      "linkedin": "https://www.linkedin.com/in/aman-kumar-sonkar-19b768294/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 71,
    "name": "Ikchhit Kumar",
    "role": "Web, App, and Project Development Executive",
    "badge": "Frontend Developer",
    "year": "2021",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQHiFNPzl1VfzA/profile-displayphoto-shrink_800_800/B56ZWdtF1vHsAc-/0/1742107598890?e=1757548800&v=beta&t=hGGsITaADXajS8kfnClfr0W2CS7QvGbGbS7hFKxcPD0",
    "social": {
      "linkedin": "https://www.linkedin.com/in/ikchhit-kumar-pandey/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 72,
    "name": "Aditya Dixit",
    "role": "Web, App, and Project Development Executive",
    "badge": "Backend Developer",
    "year": "2021",
    "image": "",
    "social": {
      "linkedin": "",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 73,
    "name": "Kumari Astha Rani",
    "role": "Web, App, and Project Development Executive",
    "badge": "Full Stack Developer",
    "year": "2021",
    "image": "",
    "social": {
      "linkedin": "",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 74,
    "name": "Sanjay Chaurasiya",
    "role": "Web, App, and Project Development Executive",
    "badge": "Mobile Developer",
    "year": "2021",
    "image": "ata:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "social": {
      "linkedin": "https://www.linkedin.com/in/sanjaychaurasiya/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 75,
    "name": "Shivam Pandey",
    "role": "Partnership and Outreach Executive",
    "badge": "Outreach Coordinator",
    "year": "2021",
    "image": "https://media.licdn.com/dms/image/v2/C4E03AQGCUMMvku5rxg/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1590665510400?e=1757548800&v=beta&t=p5OVmTpI4jF78CojgfzFvwzzjwSRSE0Uk1-sqVHlUtE",
    "social": {
      "linkedin": "https://www.linkedin.com/in/shivam-26/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 76,
    "name": "Aryan Singh",
    "role": "Partnership and Outreach Executive",
    "badge": "Partnership Manager",
    "year": "2021",
    "image": "https://media.licdn.com/dms/image/v2/D4E03AQGgcBwG6jpx0A/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1724088241996?e=1757548800&v=beta&t=Gy3oxYWBLswPkP2LqVAlgtInWCIt1dsmM5vwXqEzT5I",
    "social": {
      "linkedin": "https://www.linkedin.com/in/aryan-singh-b16856323/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 77,
    "name": "Prehans Gupta",
    "role": "Partnership and Outreach Executive",
    "badge": "Sponsor Manager",
    "year": "2021",
    "image": "https://media.licdn.com/dms/image/v2/D4D03AQFATAwSKy60AA/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1690006759945?e=1757548800&v=beta&t=dqJVNFo3RVSfFktion8Wp0f8MpIEqv1-DTpBVaS4i4U",
    "social": {
      "linkedin": "https://www.linkedin.com/in/prehansgupta2024/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 78,
    "name": "Riva Diwan",
    "role": "Partnership and Outreach Executive",
    "badge": "Networking Coordinator",
    "year": "2021",
    "image": "https://media.licdn.com/dms/image/v2/C5603AQHfFuxewLBFjA/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1629313648719?e=1757548800&v=beta&t=D9KPGO6e8PuME4blpoK95gi-uEuWMN_0akIeRKJuQxI",
    "social": {
      "linkedin": "https://www.linkedin.com/in/rivadiwan/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 79,
    "name": "Khushi Singh",
    "role": "Partnership and Outreach Executive",
    "badge": "Marketing Lead",
    "year": "2021",
    "image": "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "social": {
      "linkedin": "https://www.linkedin.com/in/khushi-singh-4b2a67210/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 80,
    "name": "Abhinash Kumar yadav",
    "role": "GDSC Lead 2021-22",
    "position": "GDG Lead",
    "badge": "",
    "year": "2020",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759042666/Abhishek_Kumar_yadav_Sir.jpeg_xu0f7i.jpg",
    "social": {
      "linkedin": "https://www.linkedin.com/in/ralphcoder/",
      "twitter": "",
      "github": ""
    }
  },
  {
    "id": 81,
    "name": "Abhishek Kumar yadav",
    "role": "GDSC Lead 2020-21",
    "position": "GDG Lead",
    "badge": "",
    "year": "2019",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759042667/Abhinash_Kumar_yadav_Sir.jpeg_vlhyiw.jpg",
    "social": {
      "linkedin": "https://www.linkedin.com/in/abhishek-kumar-yadav-82a751270/",
      "twitter": "",
      "github": ""
    }
  }
];

// Cloudinary helpers: Build transformed URLs in the path for reliability and CDN caching
function isCloudinaryUrl(url) {
  return typeof url === 'string' && url.includes('res.cloudinary.com');
}

function buildCloudinaryUrl(url, width) {
  try {
    if (!isCloudinaryUrl(url)) return url;
    // Insert transformation after "/upload/"
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return url;

    const prefix = url.slice(0, uploadIndex + '/upload/'.length);
    const suffix = url.slice(uploadIndex + '/upload/'.length);
    // If width is provided, cap it; otherwise omit
    const widthPart = width ? `,w_${width}` : '';
    const transformation = `f_auto,q_auto,dpr_auto,c_limit${widthPart}`;

    // Avoid duplicating transformations
    if (suffix.startsWith('f_auto') || suffix.startsWith('q_auto')) {
      return url; // assume already transformed
    }
    return `${prefix}${transformation}/${suffix}`;
  } catch (e) {
    console.warn('Error building Cloudinary URL:', e);
    return url;
  }
}

function buildResponsiveSrcSet(url) {
  if (!isCloudinaryUrl(url)) return undefined;
  const widths = [200, 300, 400, 600, 800];
  return widths.map(w => `${buildCloudinaryUrl(url, w)} ${w}w`).join(', ');
}

export default function Team() {
  const { fileUrl } = useAuth();
  const [upload, setUpload] = useState(false);
  const [selectedYear, setSelectedYear] = useState("GDG Lead");
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };
  
  // Lightweight 3D tilt + scale wrapper using Tailwind for smooth transitions
  function TiltWrapper({ children }) {
    const innerRef = useRef(null);
    const theme = useTheme();
    const [isHovered, setIsHovered] = useState(false);
  
    function handleMouseMove(e) {
      const target = innerRef.current;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const px = (x / rect.width) - 0.5; // -0.5 to 0.5
      const py = (y / rect.height) - 0.5;
      const rotateY = px * 12; // max ~12deg
      const rotateX = -py * 12;
      target.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    }
  
    function handleMouseEnter() {
      setIsHovered(true);
    }
  
    function handleMouseLeave() {
      const target = innerRef.current;
      if (!target) return;
      target.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
      setIsHovered(false);
    }
  
    // Unified black shadow (light and dark themes)
    const shadowStyle = isHovered
      ? '0 25px 60px -12px rgba(0, 0, 0, 0.35)'
      : '0 4px 20px rgba(0, 0, 0, 0.10)';
  
    return (
      <div className="group [perspective:1000px]">
        <div
          ref={innerRef}
          className="transform-gpu will-change-transform"
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{ 
            transformStyle: 'preserve-3d',
            boxShadow: shadowStyle,
            transition: 'transform 150ms ease-out, box-shadow 300ms ease'
          }}
        >
          {children}
        </div>
      </div>
    );
  }
  function handleUpload() {
    setUpload(true);
  }
  // Normalize role to a category key for ordering
  function getTeamCategory(member) {
    const role = (member?.role || '').toLowerCase();
    if (role.includes('content') || role.includes('management')) return 'content';
    if (role.includes('web')) return 'web';
    if (role.includes('ai/ml') || role.includes('ai') || role.includes('machine') || role.includes('ml') || role.includes('cyber')) return 'ai';
    if (role.includes('android')) return 'android';
    if (role.includes('ui/ux') || role.includes('ui') || role.includes('ux') || role.includes('design')) return 'uiux';
    if (role.includes('dsa') || role.includes('cp')) return 'dsa';
    return 'other';
  }

  const orderRank = {
    content: 1,
    web: 2,
    ai: 3,
    android: 4,
    uiux: 5,
    dsa: 6,
    other: 999
  };

  let filteredMembers = selectedYear?.includes('GDG Lead')
    ? teamData.filter(member => member?.position?.includes("GDG Lead"))
    : teamData?.filter(member => member?.year === selectedYear);

  // For 2025, sort by the specified category order
  if (selectedYear === '2025') {
    filteredMembers = [...filteredMembers].sort((a, b) => {
      // Keep Shaurya Srivastava (id: 100) always first
      if (a.id === 100 && b.id !== 100) return -1;
      if (b.id === 100 && a.id !== 100) return 1;
      const ra = orderRank[getTeamCategory(a)] || 999;
      const rb = orderRank[getTeamCategory(b)] || 999;
      if (ra !== rb) return ra - rb;
      return a.name.localeCompare(b.name);
    });
  }
  console.log("fileUrll", fileUrl)
  console.log("filtered member", filteredMembers)

  return (
    <>
      <TeamSectionContainer id="team" className="animate-section">
        <SectionContent ref={sectionRef}>
          <SectionHeader>
            <SectionTitle>Our Team</SectionTitle>
            <SectionDescription>
              Meet the passionate individuals who make GDG MMMUT possible. Our team is dedicated to fostering a vibrant tech community and organizing impactful events.
            </SectionDescription>
          </SectionHeader>
          <FilterContainer>
            <FilterButton
              active={selectedYear === "GDG Lead"}
              onClick={() => setSelectedYear('GDG Lead')}
            >
              Our Leads
            </FilterButton>
            <FilterButton
              active={selectedYear === '2025'}
              onClick={() => setSelectedYear('2025')}
            >
              2025
            </FilterButton>
            <FilterButton
              active={selectedYear === '2024'}
              onClick={() => setSelectedYear('2024')}
            >
              2024
            </FilterButton>
            <FilterButton
              active={selectedYear === '2023'}
              onClick={() => setSelectedYear('2023')}
            >
              2023
            </FilterButton>
            <FilterButton
              active={selectedYear === '2022'}
              onClick={() => setSelectedYear('2022')}
            >
              2022
            </FilterButton>
            <FilterButton
              active={selectedYear === '2021'}
              onClick={() => setSelectedYear('2021')}
            >
              2021
            </FilterButton>
          </FilterContainer>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : undefined}
          >
            <TeamGrid>
              {filteredMembers?.map((member) => (
                <TiltWrapper key={member.id}>
                  <TeamMemberCard 
                    variants={itemVariants} 
                    className="transition-transform duration-700 ease-in-out"
                    $isLead={selectedYear === "GDG Lead"}
                  >
                  <MemberImage>
                    <img 
                      src={buildCloudinaryUrl(member?.image, 600)} 
                      srcSet={buildResponsiveSrcSet(member?.image)}
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 250px"
                      alt={member.name}
                      loading={member.id <= 104 ? 'eager' : 'lazy'}
                      fetchPriority={member.id <= 104 ? 'high' : 'auto'}
                      referrerPolicy={!isCloudinaryUrl(member?.image) ? 'no-referrer' : undefined}
                      decoding="async"
                      style={{
                        opacity: 0,
                        transition: 'opacity 0.3s ease-in-out'
                      }}
                      onLoad={(e) => {
                        if (e.target.dataset.placeholder === 'true') {
                          return; // keep reduced opacity for placeholder
                        }
                        e.target.style.opacity = '1';
                      }}
                      onError={(e) => {
                        // fallback to original or a placeholder to avoid broken images
                        if (isCloudinaryUrl(member?.image)) {
                          const original = member?.image;
                          if (e.target.src !== original) {
                            e.target.src = original;
                          }
                          e.target.style.opacity = '1';
                        } else {
                          // Use local logo as placeholder with reduced opacity for subtlety
                          e.target.dataset.placeholder = 'true';
                          e.target.src = '/GDG_Logo.svg';
                          e.target.style.opacity = '0.35';
                        }
                      }}
                    />
                    <button onClick={handleUpload}>Upload</button>
                  </MemberImage>

                  <MemberContent>
                    <>
                      {
                        selectedYear != 'GDG Lead' ? <><RoleBadge $role={member.badge}>
                          {member.badge.charAt(0).toUpperCase() + member.badge.slice(1)}
                        </RoleBadge></> :
                          <></>
                      }
                    </>

                    <MemberName>{member.name}</MemberName>
                    <MemberRole>{member.role}</MemberRole>
                    <SocialLinks>
                      <SocialLink
                        href={member.social.linkedin}
                        target="_ blank"
                        whileHover={{ y: -3 }}
                        aria-label={`${member.name}'s LinkedIn`}
                      >
                        <i className="fab fa-linkedin"><FaLinkedin /></i>
                      </SocialLink>
                      <SocialLink
                        href={member.social.twitter}
                        target="_blank"
                        whileHover={{ y: -3 }}
                        aria-label={`${member.name}'s Twitter`}
                      >
                        <i className="fab fa-twitter"><FaTwitter /></i>
                      </SocialLink>
                      <SocialLink
                        href={member.social.github}
                        target="_blank"
                        whileHover={{ y: -3 }}
                        aria-label={`${member.name}'s GitHub`}
                      >
                        <i className="fab fa-github"><FaGit /></i>
                      </SocialLink>
                    </SocialLinks>
                  </MemberContent>
                  </TeamMemberCard>
                </TiltWrapper>
              ))}
            </TeamGrid>
          </motion.div>
        </SectionContent>
      </TeamSectionContainer>
      {upload && <motion.div style={{
        position: "fixed",
        top: "0",
        left: "0",
        right: "0",
        bottom: "0",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(5px)",
        display: "flex",
        justifyContent: " center",
        alignItems: "center",
        zIndex: "1000"
      }}
      >
        <Uploadbox setUpload={setUpload} />
      </motion.div>}
    </>
  );
};