# StudySphere

> **StudySphere** - A next generation virtual group study platform

## Table of Contents
- [Description](#description)
- [Links](#links)
- [Tech Stack](#tech-stack)
- [Progress](#progress)
- [Future Scope](#future-scope)
- [Applications](#applications)
- [Project Setup](#project-setup)
- [Usage](#usage)

---

## 📝 Description

### General Description
StudySphere... as the name suggests is the next generation virtual group study platform designed for the students by the students. It involved many entities such as student's particular organization, teachers & students of that organization etc. Using this web platform organizations can improve their overall flow of learning. All the students & teachers of the organizations can have a insightful communication through interactive channels where teachers can upload study documents, arrange assessments for the students. Also if a group of students wants to study only in their anonymous group then they can create their own private channels where they can interact.

### Workflow
* **Organization Registration:** Organization should register themselves. Separate general channel will be created for each organization.
* **Invites:** Then admin can share organization invite code to their respective entities in the organization such as teachers, students etc.
* **Channels:** Teachers can create channels as per their requirements to interact with the students. Channel features include: Realtime interactive chat, Realtime video streaming along with whiteboard and screen sharing like attractive features, etc.
* **Participation:** User can join to the only one organization and multiple channels at a time. Users in the organization can participate in the assessments uploaded by the admins in their respective channel and can watch their rankings in the leaderboard section of the organization which indicates continuous progress in the form of points & graph.
* **Profile:** User can also view their profile which is updated along with the active participation of the user on our platform.

---

## 🔗 Links

* [GitHub Repository](https://github.com/PranavSriram39/StudySphere)
* [Hosted Website Link](https://studysphere39.vercel.app)
* [Hosted Backend Link](https://studysphere-backend-nygl.onrender.com)

---

## 🤖 Tech-Stack

### Front-end
* Next.js
* React.js
* Tailwind CSS
* Material UI
* Framer Motion

### Back-end
* Node.js
* Express.js
* Flask
* Cloudinary (for storing media content)

### Database
* MongoDB

### API Management Platform
* Postman

### Project Deployment
* Vercel (Frontend)
* Render (Backend)

---

## 📈 Progress

### Fully Implemented Features
- [x] Customized channel creation.
- [x] General channel where everyone in the organization can interact.
- [x] Exclusive Group chat for the channels for texting, sharing important files such as pdfs, ppts or doc, or for just bickering.
- [x] Realtime video meet feature for one to one interaction along with screen sharing capability.
- [x] White board functionality which helps users for demonstration purpose.
- [x] Assessment for users for testing their skills or for teachers to conduct TAs, all just a click away, just upload your pdf file and get quizzes generated automatically with points scores.
- [x] Leaderboard to keep track of users points and to keep their competitive fire ignited.
- [x] Graphs and Charts to track the progress of a user to correctly gauge his skills and to show users journey along the way.

### Partially Implemented Features
- [ ] Scheduling of the assessments.
- [ ] Scheduling the events in platform itself (such as scheduling hackathons and have our AI calculate the scores and rankings).

---

## 🔮 Future Scope

* Scheduling the events in platform itself, (such as scheduling hackathons and have our AI calculate the scores and rankings).
* Exclusive user mental health checker.

---

## 💸 Applications

Your virtual group study platform contributes to solving real-life problems by:
* Enhancing remote learning and collaboration.
* Bridging the gap in education by providing equal access to all the students in the organization.
* Improving communication and teamwork in various settings.
* Facilitating dynamic learning channels and adaptable structures.
* Offering assessment and skill development opportunities.
* Monetization can be achieved through premium features, collaborations with institutions, and certification programs.

---

## 🛠 Project Setup

### Frontend
1.  Install Node.js runtime on your local machine.
2.  Navigate to the frontend directory.
3.  Install dependencies:
    ```bash
    npm i --force
    ```
4.  Run the development server:
    ```bash
    npm run dev
    ```

### Backend
1.  Create a new folder & initialize the project using `npm init`.
2.  Install required dependencies.
3.  Create a new account on MongoDB Atlas and create a new project.
4.  Connect to the project using the MongoDB connection string via Mongoose in the Express app.
5.  Run the server:
    ```bash
    node server.js
    ```

> **Note:** Others can simply fork the repository & then clone it in their machine. Once done they should run `npm i --force` to install all the required dependencies.

---

## 💻 Usage

1.  **Environment Variables:** Users are required to add a `.env` file in order to run the project.
2.  **Start:** Simply run the following command to start the project:
    ```bash
    npm run dev
    ```
