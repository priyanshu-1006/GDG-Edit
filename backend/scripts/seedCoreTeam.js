import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CoreTeamMember from '../models/CoreTeamMember.js';
import connectDB from '../config/database.js';

dotenv.config();

const teamData = [
  {
    "name": "Avanish Upadhyay",
    "role": "Web Dev Team",
    "badge": "Web Developer",
    "year": "2024",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759052268/Screenshot_2025-09-28_150718_giend7.png",
    "social": {
      "linkedin": "https://www.linkedin.com/in/avanish633/",
      "twitter": "https://x.com/AvanishU1807",
      "github": "https://github.com/itsmeavanish"
    },
    "category": "core"
  },
  {
    "name": "Aditya Pratap Singh",
    "role": "Web Dev Team",
    "badge": "Web Developer",
    "year": "2024",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQEa89vnpYSKzg/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1723404895368?e=1757548800&v=beta&t=aOn0H36gOZyAc-MaRTbdu5pdlENlcoXqyZ9SV7zyPDM",
    "social": {
      "linkedin": "https://www.linkedin.com/in/aditya-pratap-singh27/",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Ujjwal Gupta",
    "role": "Web Dev Team",
    "badge": "Web Developer",
    "year": "2024",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759053952/ujjwal_sir_mbg2se.png",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Anmol Tomar",
    "role": "Web Dev Team",
    "badge": "Web Developer",
    "year": "2024",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759054318/anmol_mintp3.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Vikhyat Singh",
    "role": "Android Dev Team",
    "badge": "Android Developer",
    "year": "2024",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759061340/vikhyat_sir_ac0kp5.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Vivek Maurya",
    "role": "Android Dev Team",
    "badge": "Android Developer",
    "year": "2024",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759069603/vivek_wtoijd.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Saksham Mishra",
    "role": "Android Dev Team",
    "badge": "Android Developer",
    "year": "2024",
    "image": "https://res.cloudinary.com/dsvnqnvt7/image/upload/v1759056016/saksham_sir_rmomui.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Anurag Yadav",
    "role": "Design Team",
    "badge": "Designer",
    "year": "2024",
    "image": "https://res.cloudinary.com/dsvnqnvt7/image/upload/v1759056984/Screenshot_2025-09-28_162518_bqe93l.png",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Madhu Yadav",
    "role": "Design Team",
    "badge": "Designer",
    "year": "2024",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759068837/madhu_k2w73o.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Prateek Khare",
    "role": "Design Team",
    "badge": "Designer",
    "year": "2024",
    "image": "https://res.cloudinary.com/dsvnqnvt7/image/upload/v1759058503/prateek_sir_s047ei.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Harshit Singh",
    "role": "DSA/CP Team",
    "badge": "Competitive Programmer",
    "year": "2024",
    "image": "https://res.cloudinary.com/dsvnqnvt7/image/upload/v1759058729/Screenshot_2025-09-28_165412_klktgc.png",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Shivam Singh",
    "role": "DSA/CP Team",
    "badge": "Competitive Programmer",
    "year": "2024",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759068970/shivam_scb6qq.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Kriti Yadav",
    "role": "DSA/CP Team",
    "badge": "Competitive Programmer",
    "year": "2024",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759077821/kriti_z2nrro.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Kunal Shrivastav",
    "role": "DSA/CP Team",
    "badge": "Competitive Programmer",
    "year": "2024",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759060557/kunal_an6muy.png",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Ananya Gupta",
    "role": "Content & Management Team",
    "badge": "Content Creator",
    "year": "2024",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQHSeE_4U6GRrg/profile-displayphoto-shrink_800_800/B56ZOhcq0SGwAc-/0/1733580480295?e=1757548800&v=beta&t=EcvAhwC6cagz-NWne_bt4dOX-ujwoAn-VZTrenrVZuM",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Ananya",
    "role": "Content & Management Team",
    "badge": "Content Creator",
    "year": "2024",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759078304/ananya_ei3pwx.png",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Ashutosh Maurya",
    "role": "Content & Management Team",
    "badge": "Content Creator",
    "year": "2024",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759078441/ashutosh_boekul.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Atishay Kumar Pandey",
    "role": "Content & Management Team",
    "badge": "Content Creator",
    "year": "2024",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759078528/atishay_qrls62.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Jahnawi Agarwal",
    "role": "Content & Management Team",
    "badge": "Content Creator",
    "year": "2024",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759078577/jahnavi_kd1kau.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Riya Verma",
    "role": "AI/ML Team",
    "badge": "AI/ML Developer",
    "year": "2024",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759078683/riya_ffqhox.jpg",
    "social": {
      "linkedin": "https://www.linkedin.com/in/riya-verma-28b461289/",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Snehil Saxena",
    "role": "AI/ML Team",
    "badge": "AI/ML Developer",
    "year": "2024",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759078783/snehil_hdflcr.jpg",
    "social": {
      "linkedin": "https://www.linkedin.com/in/snehil-saxena-b541a4264/",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Abhay Chauhan",
    "role": "AI/ML Team",
    "badge": "AI/ML Developer",
    "year": "2024",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759078874/ahay_g4zblh.png",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Shaurya Srivastava",
    "role": "Content & Management Team",
    "badge": "Content Creator",
    "year": "2025",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759079904/meside_okwmn0.jpg",
    "social": {
      "linkedin": "https://www.linkedin.com/in/shaurya-srivastava/",
      "twitter": "https://twitter.com/shaurya_sriv",
      "github": "https://github.com/shaurya-srivastava"
    },
    "category": "core"
  },
  {
    "name": "Abhi Aryan",
    "role": " UI/UX Team",
    "badge": "Designer",
    "year": "2025",
    "image": "https://res.cloudinary.com/dsvnqnvt7/image/upload/v1760638728/IMG-20251008-WA0011_dw9iz4.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Aradhya Singh",
    "role": "Content & Management Team",
    "badge": "Content Creator",
    "year": "2025",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759083620/aradhya_m6kxlm.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Shreya Tiwari",
    "role": "AI/ML & Cyber Security Team",
    "badge": "AI/ML Developer",
    "year": "2025",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759124587/shreya_py0wij.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Saloni Verma",
    "role": "UI/UX Team",
    "badge": "Designer",
    "year": "2025",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759081658/saloni_ws4xib.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Vikas Chaurasia",
    "role": "Content & Management Team",
    "badge": "Content Creator",
    "year": "2025",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759081404/vikas_l8j7y0.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Priyanshu Chausasia",
    "role": "Web Dev Team",
    "badge": "Web Developer",
    "year": "2025",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759081939/priyanshu_z6mrpn.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Shubham Yadav",
    "role": "Content & Management Team",
    "badge": "Content Creator",
    "year": "2025",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759082067/shubham_z7xcm5.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Manish Gupta",
    "role": "DSA/CP Team",
    "badge": "Competitive Developer",
    "year": "2025",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759082390/manish_gnzoip.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Saharsh Vijay Singh",
    "role": "UI/UX Team",
    "badge": "Designer",
    "year": "2025",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759082702/saharsh_ttcvvi.png",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Darshika Bhaskar",
    "role": "Content & Management Team",
    "badge": "Content Creator",
    "year": "2025",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759083507/darshika_ftogro.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Adhrav Rai",
    "role": "AI/ML & Cyber Security Team",
    "badge": "AI/ML Developer",
    "year": "2025",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759126822/adarak_eutpfj.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Samriddhi Shree",
    "role": "AI/ML Team",
    "badge": "AI/ML Developer",
    "year": "2025",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759137457/samriddhi_d92w3g.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Nikhil Yadav",
    "role": "Web Dev Team",
    "badge": "Web Developer",
    "year": "2025",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759137463/nikhi_jc6hur.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Aditi Pandey",
    "role": "Android Dev Team",
    "badge": "Android Developer",
    "year": "2025",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759137695/aditi_ojocnm.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Soumya Gupta",
    "role": "Design Team",
    "badge": "Designer",
    "year": "2025",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759137467/soumya_emhsn0.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Ananya Yadav",
    "role": "UI/UX Team",
    "badge": "Designer",
    "year": "2025",
    "image": "https://res.cloudinary.com/dsvnqnvt7/image/upload/v1759158292/Ananya_Yadav_ajfa7s.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Rasshi Ashish Khan",
    "role": "DSA/CP Team",
    "badge": "Competitive Programmer",
    "year": "2025",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759154024/rasshi_njbwl6.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Durgesh Gupta",
    "role": "Content & Management Team",
    "badge": "Content Creator",
    "year": "2025",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759153913/durgesh_bxpu9s.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Dheeraj Yadav",
    "role": "AI/ML Team",
    "badge": "AI/ML Developer",
    "year": "2025",
    "image": "https://res.cloudinary.com/dsvnqnvt7/image/upload/v1759159004/IMG_20250915_192641_-_Dheeraj_YADAV_arivuy.png",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Anchal Patel",
    "role": " Web Dev Team",
    "badge": "Web Developer",
    "year": "2025",
    "image": "https://res.cloudinary.com/dsvnqnvt7/image/upload/v1759158291/Anchal_Patel_jz7mzf.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Bhoomi Srivastava",
    "role": "UI/UX Team",
    "badge": "Designer",
    "year": "2025",
    "image": "https://res.cloudinary.com/dsvnqnvt7/image/upload/v1759165687/bhoomi_isgc7f.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Aman Kumar",
    "role": "DSA/CP Team",
    "badge": "Competitive Programmer",
    "year": "2025",
    "image": "https://res.cloudinary.com/dsvnqnvt7/image/upload/v1759159139/Picsart_25-07-01_23-23-15-094_-_Aman_Kumar_imtdmy.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Ayush Dubey",
    "role": "Content & Management Team",
    "badge": "Content Creator",
    "year": "2025",
    "image": "https://res.cloudinary.com/dsvnqnvt7/image/upload/v1759158955/IMG63829291UE73_-_Ayush_Dubey_nvw1gk.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Himanshi Singh",
    "role": "Content & Management Team",
    "badge": "Content Creator",
    "year": "2025",
    "image": "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759158154/himanshi_wzj8jq.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
    "name": "Amitesh Vishwakarma",
    "role": "AI/ML Team",
    "badge": "AI/ML Developer",
    "year": "2025",
    "image": "https://res.cloudinary.com/dsvnqnvt7/image/upload/v1759158822/IMG-20250915-WA0043_-_Amitesh_Vishwakarma_mw8bli.jpg",
    "social": {
      "linkedin": "https://linkedin.com",
      "twitter": "https://twitter.com",
      "github": "https://github.com"
    },
    "category": "core"
  },
  {
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
    },
    "category": "core"
  },
  {
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
    },
    "category": "core"
  },
  {
    "name": "Avinash Mishra",
    "role": "GDG Co-lead 2024-25",
    "badge": "Content Creator",
    "year": "2023",
    "image": "https://www.linkedin.com/dms/prv/image/v2/D5606AQEt9NHToDRKiQ/messaging-image-720/B56ZiJFVQvH0Ag-/0/1754646533804?m=AQKr-6e5kqoZOAAAAZiJFWN-Qf0OfLi4IsgTonbD7y-BQijYuXDobuN_WuM&ne=1&v=beta&t=MyzPop_byeXdJTqZhA1dWWug5jABnN0dtCH_6qeWweI",
    "social": {
      "linkedin": "https://www.linkedin.com/in/avinash-m-321128283/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Madhur Pratap Singh Gaur",
    "role": "Web & Firebase Team",
    "badge": "Web Developer",
    "year": "2023",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQGkEqGr3-BnRQ/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1718821349966?e=1757548800&v=beta&t=3eubEjrzfO9m8m1YUxAMPrBwbT3OSQIQ7TNVtlFrXG0",
    "social": {
      "linkedin": "https://www.linkedin.com/in/abhay-chauhan29/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Sandeep Singh (ECE)",
    "role": "Web & Firebase Team",
    "badge": "Web Developer",
    "year": "2023",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQE5rv-CkbJsdQ/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1729936991258?e=1757548800&v=beta&t=8-lFWJpZLP_8E_wPkvh5t7XgsVzgcYZNRq6Dfcpss6o",
    "social": {
      "linkedin": "https://www.linkedin.com/in/sandeep-singh-445058254/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Aditya Gaur",
    "role": "Web & Firebase Team",
    "badge": "Web Developer",
    "year": "2023",
    "image": "https://www.linkedin.com/dms/prv/image/v2/D5606AQE4cFA7xQK4Jw/messaging-image-720/B56ZiJNO1zG4AY-/0/1754648605252?m=AQKkCZYWoajXWAAAAZiJUngaL0O7lF1pkWe9jHyyc-nzYE-0P8AUJxeSMIo&ne=1&v=beta&t=l9AJsfHxnoTt2ORxfbh9ZcHXalX_-P4VP-QNMcMdOQ4",
    "social": {
      "linkedin": "",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Pranjal Mani",
    "role": "Web & Firebase Team",
    "badge": "Web Developer",
    "year": "2023",
    "image": "",
    "social": {
      "linkedin": "",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Jyoti Maurya",
    "role": "Web & Firebase Team",
    "badge": "Web Developer",
    "year": "2023",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQGP-DzNw3se7A/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1727194174971?e=1757548800&v=beta&t=zKZzsVM69LRrvqjzP51OoRZA70rkC7l9zwDh3Q10QAA",
    "social": {
      "linkedin": "https://www.linkedin.com/in/jyoti-maurya-b9a5b8255/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Gayetri Verma",
    "role": "AI/ML, Cybersecurity & Cloud Team",
    "badge": "AI/ML Enthusiast",
    "year": "2023",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQHKk0n9cvBUCw/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1715702111001?e=1757548800&v=beta&t=1z-qa_dBanL9EryhBCkcjhre2pUXFP8oPubiGoXe0vg",
    "social": {
      "linkedin": "https://www.linkedin.com/in/-gayatri-/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Aditya Patel",
    "role": "AI/ML, Cybersecurity & Cloud Team",
    "badge": "AI/ML Enthusiast",
    "year": "2023",
    "image": "",
    "social": {
      "linkedin": "https://www.linkedin.com/in/sayaditya/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Sarika Kaushal",
    "role": "AI/ML, Cybersecurity & Cloud Team",
    "badge": "AI/ML Enthusiast",
    "year": "2023",
    "image": "",
    "social": {
      "linkedin": "https://www.linkedin.com/in/sarika-kaushal-192a92283/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Aditya Kumar Kasaudhan",
    "role": "Android Team",
    "badge": "Android Developer",
    "year": "2023",
    "image": "https://media.licdn.com/dms/image/v2/D4E03AQFuE_3M_VJg6w/profile-displayphoto-shrink_800_800/B4EZcdE0DJG4Ag-/0/1748539492257?e=1757548800&v=beta&t=PT_9UF7b4cWbmOnv3LJWNvw3g2-NHXb_TtXclCMcr0g",
    "social": {
      "linkedin": "https://www.linkedin.com/in/aditya-kumar-8a8a51326/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Suraj Kasaudhan",
    "role": "Android Team",
    "badge": "Android Developer",
    "year": "2023",
    "image": "",
    "social": {
      "linkedin": "https://www.linkedin.com/in/suraj-kasaudhan-ks/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Sandeep Singh (ECE)",
    "role": "Android Team",
    "badge": "Android Developer",
    "year": "2023",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQGhTq9LehoOAQ/profile-displayphoto-shrink_400_400/B56ZUjUVFPGsAg-/0/1740054287396?e=1757548800&v=beta&t=J0qOBfMYam5QmcL4BhUeJqKFokFonxnafn4Ve2TV1L0",
    "social": {
      "linkedin": "",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Ritika Yadav",
    "role": "Graphics & Creativity Team",
    "badge": "Designer",
    "year": "2023",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQHZcUj2G8J7kg/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1730605545388?e=1757548800&v=beta&t=1Iz_cDZC6Ko7VGJK5ZnxuwKeVCCWwG_B5udwwOsNB84",
    "social": {
      "linkedin": "https://www.linkedin.com/in/ritika-yadav-933052258/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Divyansh Gupta",
    "role": "Graphics & Creativity Team",
    "badge": "Designer",
    "year": "2023",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQGL1YeL5n6CEw/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1725198795892?e=1757548800&v=beta&t=McCk0JmAxwzYscvXwKHC9-HjsOfqJseoaNoQ09q5F28",
    "social": {
      "linkedin": "https://www.linkedin.com/in/divyansh-gupta-0ab55b258/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Tanya Batham",
    "role": "Content Team",
    "badge": "Content Creator",
    "year": "2023",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQHp4DQEc76QGg/profile-displayphoto-crop_800_800/B56Zg2hfwoHUAI-/0/1753261409085?e=1757548800&v=beta&t=lIVjtgmBe52fsfUB14ZsmP_QVUnULMl6ErP01sFWtHE",
    "social": {
      "linkedin": "https://www.linkedin.com/in/tanya-batham-69604724b/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Abhinav Kumar",
    "role": "Event Coordination & Sponsorship Team",
    "badge": "Event Coordinator",
    "year": "2023",
    "image": "https://media.licdn.com/dms/image/v2/D4D03AQE84vntBLlVIg/profile-displayphoto-shrink_800_800/B4DZS4SkqwG8Ag-/0/1738258665409?e=1757548800&v=beta&t=Q3goUs_Fr9Mu4xrrEWPoMk_ng6Eyh7ngyuh4BMA38Nk",
    "social": {
      "linkedin": "https://www.linkedin.com/in/abhinav-kumar-a98b96333/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Nainsi Gupta",
    "role": "Event Coordination & Sponsorship Team",
    "badge": "Event Coordinator",
    "year": "2023",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQHuGUBpCjY43g/profile-displayphoto-shrink_800_800/B56Zb93TRcHgAg-/0/1748015860669?e=1757548800&v=beta&t=b3rqh4HnfMlJg5jit5Xl10vbFLqGlLKpZn9bK7Then4",
    "social": {
      "linkedin": "https://www.linkedin.com/in/nainsi-gupta-549488258/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Abhirup Pratap Chaurasiya",
    "role": "Event Coordination & Sponsorship Team",
    "badge": "Event Coordinator",
    "year": "2023",
    "image": "",
    "social": {
      "linkedin": "",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Paridhi Mittal",
    "role": "Event Coordination & Sponsorship Team",
    "badge": "Event Coordinator",
    "year": "2023",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQGUN9saFbCaTg/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1726507968764?e=1757548800&v=beta&t=eCZYCR7abVlB5HE79yMTxLrRw2aR-I3iAoAVvTnXsMc",
    "social": {
      "linkedin": "https://www.linkedin.com/in/paridhi-mittal-64bb94251/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Anuj Kashyap",
    "role": "Event Coordination & Sponsorship Team",
    "badge": "Event Coordinator",
    "year": "2023",
    "image": "",
    "social": {
      "linkedin": "",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Aastha Singh Sachan",
    "role": "Web & Firebase Team",
    "badge": "Web Developer",
    "year": "2022",
    "image": "",
    "social": {
      "linkedin": "",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Abhishek Yadav",
    "role": "Web & Firebase Team",
    "badge": "Web Developer",
    "year": "2022",
    "image": "https://media.licdn.com/dms/image/v2/C4D03AQHL7RnuSeWLgA/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1655254741573?e=1757548800&v=beta&t=EdqHpbc31F0Mhc_BIaKkHN8jIAP-nvAqQURp5upWZ4Q",
    "social": {
      "linkedin": "https://www.linkedin.com/in/abhishekcpr/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Madhur Vatsal Bharti",
    "role": "Web & Firebase Team",
    "badge": "Web Developer",
    "year": "2022",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQHbYlZeM5nlzQ/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1711076389936?e=1757548800&v=beta&t=5QSFUdsem9wIHdnJtaX80xsT63UMmQgGN1uJYb_PdrI",
    "social": {
      "linkedin": "https://www.linkedin.com/in/madhur-vatsal/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Saurabh Singh",
    "role": "Web & Firebase Team",
    "badge": "Web Developer",
    "year": "2022",
    "image": "https://media.licdn.com/dms/image/v2/C4E03AQEWd-zAjJpTKw/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1627226363660?e=1757548800&v=beta&t=wKZbBldujhUqv8lnmwpNFjxNBiNHK8MeQHYYicxumCo",
    "social": {
      "linkedin": "https://www.linkedin.com/in/saurabh-singh-9ab614218/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Sonali Rao",
    "role": "Web & Firebase Team",
    "badge": "Web Developer",
    "year": "2022",
    "image": "https://media.licdn.com/dms/image/v2/D4D03AQHJZxwENs8RnA/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1693191735474?e=1757548800&v=beta&t=A1HBx-N9uuHeRJYNx_QIdCsXjGcGbwzWTsA5V3BLQs4",
    "social": {
      "linkedin": "https://www.linkedin.com/in/sonali-rao-25b095228/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
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
    },
    "category": "core"
  },
  {
    "name": "Ritika Agrahari",
    "role": "AI/ML & Cybersecurity Team",
    "badge": "AI/ML Enthusiast",
    "year": "2022",
    "image": "",
    "social": {
      "linkedin": "https://www.linkedin.com/in/ritika-agrahari-938278230/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Satvik Tripathi",
    "role": "AI/ML & Cybersecurity Team",
    "badge": "AI/ML Enthusiast",
    "year": "2022",
    "image": "https://media.licdn.com/dms/image/v2/D4D03AQGTCwvAbM0RwQ/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1672751241929?e=1757548800&v=beta&t=PY-LLXojwdf2e8_53va3XEKVpVQPVSCtIqWO9gCG5Us",
    "social": {
      "linkedin": "https://www.linkedin.com/in/satvik-tripathi-3b6579237/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Ankit Verma",
    "role": "Android Team",
    "badge": "Android Developer",
    "year": "2022",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQEpJTCSbCaWxA/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1708697064823?e=1757548800&v=beta&t=a9tbI86ZO78b9bYgieOfGKXFxSDEcF-R66AeXrn43hU",
    "social": {
      "linkedin": "https://www.linkedin.com/in/ankit11verma/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Devansh Tripathi",
    "role": "Android Team",
    "badge": "Android Developer",
    "year": "2022",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQEIBG9rQb0r7w/profile-displayphoto-shrink_800_800/B56ZT9g2YuHsAs-/0/1739420037396?e=1757548800&v=beta&t=_pr2UdYB9TjIOeP178beYPqqkAhVJ04_T7XnHcs_zOc",
    "social": {
      "linkedin": "https://www.linkedin.com/in/devansh-tripathi-4150aa225/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Sarthak Vishwakarma",
    "role": "Android Team",
    "badge": "Android Developer",
    "year": "2022",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQFYYBEkxwJ_4Q/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1731478767702?e=1757548800&v=beta&t=InJmkJaEXc0tHyHuteQ114ObCjPofC3IJzjvSxrYKFw",
    "social": {
      "linkedin": "https://www.linkedin.com/in/hellosarthak/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Aniket Chaudhary",
    "role": "Graphics & Creativity Team",
    "badge": "Designer",
    "year": "2022",
    "image": "https://media.licdn.com/dms/image/v2/D4D03AQFYaQcuOPRB8Q/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1699551727970?e=1757548800&v=beta&t=6-a6Xn5bZm6vN7eGd8wTc-k6YOgsFYT-pWfoZKJS9vY",
    "social": {
      "linkedin": "https://www.linkedin.com/in/aniket-chaudhary98/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Atul Kumar",
    "role": "Graphics & Creativity Team",
    "badge": "Designer",
    "year": "2022",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQFlj-Se27nypw/profile-displayphoto-shrink_800_800/B56ZY7ZeGEGsAc-/0/1744753255735?e=1757548800&v=beta&t=VIpifpUSF7bOpdQ_Ddo9vMUOJyzwCk6i_4B8PDQU7CE",
    "social": {
      "linkedin": "https://www.linkedin.com/in/atul1510/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Sumit Kumar",
    "role": "Graphics & Creativity Team",
    "badge": "Designer",
    "year": "2022",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQHAKOzv7o18HQ/profile-displayphoto-shrink_800_800/B56ZbTwjQDGsAk-/0/1747309452855?e=1757548800&v=beta&t=Jsi5TXbIQSuqq4Ns4Wmp3EfBPvWjNRHx3S_MAIoYdXg",
    "social": {
      "linkedin": "https://www.linkedin.com/in/sumit-kumar-bbb38b230/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Anam Kumar Tiwari",
    "role": "Content Team",
    "badge": "Content Creator",
    "year": "2022",
    "image": "",
    "social": {
      "linkedin": "",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Gaurav Kumar Sen",
    "role": "Content Team",
    "badge": "Content Creator",
    "year": "2022",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQFKXRFih3MQLg/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1718230778246?e=1757548800&v=beta&t=lj5OF_hKod3YhYsLmjviv4Op-Bknv40WFI8JfCZLYtM",
    "social": {
      "linkedin": "https://www.linkedin.com/in/gaurav-kumar-sen-317093228/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Saemvi Gupta",
    "role": "Content Team",
    "badge": "Content Creator",
    "year": "2022",
    "image": "",
    "social": {
      "linkedin": "",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Ajit Kumar Yadav",
    "role": "Marketing & Sponsorship Team",
    "badge": "Marketing Specialist",
    "year": "2022",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQEvUYOgsMiRTw/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1677778037357?e=1757548800&v=beta&t=v4Neb0KDY3FUPuNq3nI9jugdrLtYOyQEJbce0xMbngQ",
    "social": {
      "linkedin": "https://www.linkedin.com/in/ajityaduv/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Atulya Vaibhav Pandey",
    "role": "Marketing & Sponsorship Team",
    "badge": "Marketing Specialist",
    "year": "2022",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQH6zEmlIQPMOQ/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1720977519964?e=1757548800&v=beta&t=qFK5_5tEBkFaifzfcjF669--o4bgPK6gNFaH2pUmcWw",
    "social": {
      "linkedin": "https://www.linkedin.com/in/atulya-vaibhav-pandey/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Yogeshwar Gupta",
    "role": "Marketing & Sponsorship Team",
    "badge": "Marketing Specialist",
    "year": "2022",
    "image": "https://media.licdn.com/dms/image/v2/D4D03AQFdWNkaqIgOjw/profile-displayphoto-shrink_800_800/B4DZZsoMBxHwAc-/0/1745579197553?e=1757548800&v=beta&t=XHyclTeOpzCbJPDoe33TBojTn-bMbLYpI2lCth_q-Ws",
    "social": {
      "linkedin": "https://www.linkedin.com/in/yogeshwarg/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Aniket Gupta",
    "role": "Event Coordination Team",
    "badge": "Event Coordinator",
    "year": "2022",
    "image": "",
    "social": {
      "linkedin": "https://www.linkedin.com/in/aniket310/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Anjali Gupta",
    "role": "Event Coordination Team",
    "badge": "Event Coordinator",
    "year": "2022",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQGd9qxeIZspxQ/profile-displayphoto-shrink_800_800/B56Zc_15Q3HUAg-/0/1749122783656?e=1757548800&v=beta&t=AFMJcHFjSWifZIyHGp3cOoKZeiUCchdquszp3JfWwnU",
    "social": {
      "linkedin": "https://www.linkedin.com/in/anjali-gupta2004/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Ishita Shukla",
    "role": "Event Coordination Team",
    "badge": "Event Coordinator",
    "year": "2022",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQE03LlGCHdhrg/profile-displayphoto-shrink_800_800/B56ZTVSeVzHsAk-/0/1738745179642?e=1757548800&v=beta&t=7nKl6xK0-7tS63zLDgJvGIVCkxWdq3emgVPtYfYnCiI",
    "social": {
      "linkedin": "https://www.linkedin.com/in/ishita20/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Abhay Nandan Singh",
    "role": "Media and CP Executive",
    "badge": "Media Coordinator",
    "year": "2021",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQFQecvBCDalQA/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1722880310070?e=1757548800&v=beta&t=P3It9AtAFa8qZLI7nf9G_ihET6fjPWYcLOvwoCqLnEU",
    "social": {
      "linkedin": "https://www.linkedin.com/in/deltath/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Archana Chaurasiya",
    "role": "Media and CP Executive",
    "badge": "Content Creator",
    "year": "2021",
    "image": "https://media.licdn.com/dms/image/v2/C5603AQGw-kZyDpjF-Q/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1629031913867?e=1757548800&v=beta&t=jRmW1QJ2IqZmgcZcuBF0HBPj73qPltzfD30k9HfTPFE",
    "social": {
      "linkedin": "http://linkedin.com/in/archana-chaurasiya-4507bb182/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Aradhya Srivastav",
    "role": "Media and CP Executive",
    "badge": "Public Relations",
    "year": "2021",
    "image": "",
    "social": {
      "linkedin": "https://www.linkedin.com/in/aradhya08oc01/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Anubhav Aggrawal",
    "role": "Media and CP Executive",
    "badge": "Social Media Manager",
    "year": "2021",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQGNok1iff1LVA/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1725382143110?e=1757548800&v=beta&t=sRg9CUSyTi6R-87hq-hCiKjR-Rz03JrKD6-pXZc3WOE",
    "social": {
      "linkedin": "https://www.linkedin.com/in/anubhav-agrawal-766b23203/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
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
    },
    "category": "core"
  },
  {
    "name": "Aman Kumar Sonkar",
    "role": "Web, App, and Project Development Executive",
    "badge": "Developer",
    "year": "2021",
    "image": "https://media.licdn.com/dms/image/v2/D4D03AQHcnH85mDBoXw/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1704220429057?e=1757548800&v=beta&t=JpaSeRciklAlqlmy4A60doEeNziPlRInyPNG4AiY4og",
    "social": {
      "linkedin": "https://www.linkedin.com/in/aman-kumar-sonkar-19b768294/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Ikchhit Kumar",
    "role": "Web, App, and Project Development Executive",
    "badge": "Frontend Developer",
    "year": "2021",
    "image": "https://media.licdn.com/dms/image/v2/D5603AQHiFNPzl1VfzA/profile-displayphoto-shrink_800_800/B56ZWdtF1vHsAc-/0/1742107598890?e=1757548800&v=beta&t=hGGsITaADXajS8kfnClfr0W2CS7QvGbGbS7hFKxcPD0",
    "social": {
      "linkedin": "https://www.linkedin.com/in/ikchhit-kumar-pandey/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Aditya Dixit",
    "role": "Web, App, and Project Development Executive",
    "badge": "Backend Developer",
    "year": "2021",
    "image": "",
    "social": {
      "linkedin": "",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Kumari Astha Rani",
    "role": "Web, App, and Project Development Executive",
    "badge": "Full Stack Developer",
    "year": "2021",
    "image": "",
    "social": {
      "linkedin": "",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Sanjay Chaurasiya",
    "role": "Web, App, and Project Development Executive",
    "badge": "Mobile Developer",
    "year": "2021",
    "image": "ata:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "social": {
      "linkedin": "https://www.linkedin.com/in/sanjaychaurasiya/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Shivam Pandey",
    "role": "Partnership and Outreach Executive",
    "badge": "Outreach Coordinator",
    "year": "2021",
    "image": "https://media.licdn.com/dms/image/v2/C4E03AQGCUMMvku5rxg/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1590665510400?e=1757548800&v=beta&t=p5OVmTpI4jF78CojgfzFvwzzjwSRSE0Uk1-sqVHlUtE",
    "social": {
      "linkedin": "https://www.linkedin.com/in/shivam-26/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Aryan Singh",
    "role": "Partnership and Outreach Executive",
    "badge": "Partnership Manager",
    "year": "2021",
    "image": "https://media.licdn.com/dms/image/v2/D4E03AQGgcBwG6jpx0A/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1724088241996?e=1757548800&v=beta&t=Gy3oxYWBLswPkP2LqVAlgtInWCIt1dsmM5vwXqEzT5I",
    "social": {
      "linkedin": "https://www.linkedin.com/in/aryan-singh-b16856323/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Prehans Gupta",
    "role": "Partnership and Outreach Executive",
    "badge": "Sponsor Manager",
    "year": "2021",
    "image": "https://media.licdn.com/dms/image/v2/D4D03AQFATAwSKy60AA/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1690006759945?e=1757548800&v=beta&t=dqJVNFo3RVSfFktion8Wp0f8MpIEqv1-DTpBVaS4i4U",
    "social": {
      "linkedin": "https://www.linkedin.com/in/prehansgupta2024/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Riva Diwan",
    "role": "Partnership and Outreach Executive",
    "badge": "Networking Coordinator",
    "year": "2021",
    "image": "https://media.licdn.com/dms/image/v2/C5603AQHfFuxewLBFjA/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1629313648719?e=1757548800&v=beta&t=D9KPGO6e8PuME4blpoK95gi-uEuWMN_0akIeRKJuQxI",
    "social": {
      "linkedin": "https://www.linkedin.com/in/rivadiwan/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
    "name": "Khushi Singh",
    "role": "Partnership and Outreach Executive",
    "badge": "Marketing Lead",
    "year": "2021",
    "image": "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "social": {
      "linkedin": "https://www.linkedin.com/in/khushi-singh-4b2a67210/",
      "twitter": "",
      "github": ""
    },
    "category": "core"
  },
  {
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
    },
    "category": "core"
  },
  {
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
    },
    "category": "core"
  }
];

const seedCoreTeam = async () => {
    try {
        await connectDB();
        
        console.log('Clearing existing team members...');
        await CoreTeamMember.deleteMany({});
        
        console.log('Seeding new team members...');
        await CoreTeamMember.insertMany(teamData);
        
        console.log('Core Team Seeded Successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding team:', error);
        process.exit(1);
    }
};

seedCoreTeam();
