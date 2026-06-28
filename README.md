# 2arm - Industrial Robot Motion Training Platform

> **Hackathon Project:** Complete end-to-end platform for training industrial robots using human demonstrations captured with Ray-Ban Meta smart glasses.

---

## 📋 Hackathon Submission Requirements

This README provides:
- ✅ **What the project does** - See [What Does It Do?](#-what-does-it-do)
- ✅ **How it works** - See [How Does It Work?](#-how-does-it-work)
- ✅ **How to install and run it** - See [Installation & Running](#-installation--running)
- ✅ **Complete codebase** - All code in this monorepo
- ✅ **Commit history** - All work committed during hackathon period

---

## 🎯 What Does It Do?

**2arm** is an industrial robot training data platform that solves the problem of teaching robots complex manual tasks. Instead of programming robots by hand, operators can simply:

1. **Demonstrate the task** while wearing Ray-Ban Meta smart glasses
2. **Upload the video** to the web platform
3. **Let AI track hand movements** using MediaPipe computer vision
4. **Publish the trained model** to a marketplace
5. **Deploy to robots** using ROS 2 simulation and real hardware

### Real-World Use Cases

- **Manufacturing:** Train robots to perform pick-and-place, welding, assembly tasks
- **Quality Control:** Teach inspection procedures through human demonstration
- **Packaging:** Automate complex packaging sequences
- **Skill Transfer:** Share motion models across factories and robot fleets

### What Makes It Unique?

- **No programming required** - Operators demonstrate, robots learn
- **Smart glasses integration** - Hands-free recording with egocentric view
- **Full pipeline** - From video upload to robot deployment
- **Marketplace** - Share and monetize training data
- **Open source** - Built on modern web tech and open robotics standards

---

## 🔧 How Does It Work?

### Architecture Overview

The platform consists of two main components working together:

```
┌─────────────────────────────────────────────────────────────┐
│                     2arm Platform                            │
├──────────────────────────┬──────────────────────────────────┤
│   Website (Frontend)     │   Robot Training (Backend)       │
│                          │                                  │
│  • Next.js 16 + Turbo    │  • ROS 2 Humble                 │
│  • Supabase Backend      │  • MoveIt 2                     │
│  • MediaPipe Tracking    │  • Bimanual OpenArm             │
│  • Framer Motion UI      │  • Lima VM (macOS)              │
│  • TypeScript            │  • Foxglove Visualization       │
└──────────────────────────┴──────────────────────────────────┘
```

### Technical Flow

#### 1. Data Collection (Website)
```
Ray-Ban Meta Glasses → Video Recording → Upload to Platform
                                              ↓
                                    Stored in Supabase
```

#### 2. Motion Analysis (Python Backend)
```
Video Frames → MediaPipe Hand Tracking → 3D Hand Landmarks
                                              ↓
                                    Trajectory Generation
```

#### 3. Training Data Management (Website)
```
Trajectories → Categorization → Quality Check → Publish to Marketplace
```

#### 4. Robot Deployment (Robot Training)
```
Training Data → ROS 2 Simulation → Motion Planning (MoveIt) → Robot Execution
```

### Key Technologies

**Website Platform:**
- **Frontend:** Next.js 16 with Turbopack for fast builds
- **Database:** Supabase (PostgreSQL) for video metadata and trajectories
- **Storage:** Supabase Storage for videos and thumbnails
- **Hand Tracking:** MediaPipe Hands via Python FastAPI backend
- **UI:** Framer Motion for smooth animations, Tailwind CSS for styling
- **Auth:** NextAuth.js for user management

**Robot Training:**
- **Robot Framework:** ROS 2 Humble (Humble Hawksbill)
- **Motion Planning:** MoveIt 2 for collision-free trajectories
- **Simulation:** ros2_control with fake hardware mode
- **Visualization:** Foxglove Studio and RViz
- **Robot Model:** Dual 7-DOF OpenArm arms with grippers
- **VM:** Lima for running ROS 2 on macOS without Docker overhead

---

## 🚀 Installation & Running

### Prerequisites

Choose the component you want to run:

**For Website Platform:**
- Node.js 18+ and npm
- Python 3.9+ (for MediaPipe backend)
- Supabase account (free tier: https://supabase.com)

**For Robot Training:**
- macOS (Apple Silicon recommended) or Linux
- Lima VM: `brew install lima`
- Just task runner: `brew install just`
- Foxglove Studio: https://foxglove.dev

---

## 📦 Installation Guide

### Option 1: Website Platform Only

This is the fastest way to see the platform in action.

#### Step 1: Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/2arm.git
cd 2arm/website
```

#### Step 2: Install Dependencies

```bash
npm install
```

#### Step 3: Set Up Environment Variables

```bash
# Copy the example env file
cp .env.local.example .env.local

# Edit .env.local with your credentials
# You need:
# - NEXT_PUBLIC_SUPABASE_URL (from Supabase dashboard)
# - NEXT_PUBLIC_SUPABASE_ANON_KEY (from Supabase dashboard)
# - SUPABASE_SERVICE_ROLE_KEY (from Supabase dashboard)
# - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)
```

**Getting Supabase Credentials:**
1. Go to https://supabase.com and create a free account
2. Create a new project (takes ~2 minutes)
3. Go to Project Settings → API
4. Copy the URL and anon key
5. Copy the service_role key (click "Reveal" first)

#### Step 4: Run Database Migrations

```bash
# Install Supabase CLI if needed
npm install -g supabase

# Run migrations to create tables
npm run db:migrate
```

#### Step 5: Start the Development Server

```bash
npm run dev
```

Visit **http://localhost:3000** in your browser!

**Default Login:**
- Username: `admin`
- Password: `admin`

#### Step 6: (Optional) Start MediaPipe Backend

For hand tracking functionality:

```bash
cd python-backend
pip install -r requirements.txt
python main.py
```

The Python backend runs on **http://localhost:8000**

---

### Option 2: Robot Training Only

Test the bimanual robot simulation.

#### Step 1: Clone & Navigate

```bash
git clone https://github.com/YOUR-USERNAME/2arm.git
cd 2arm/robot-training
```

#### Step 2: Create the Lima VM

```bash
# Create VM with 4 CPU, 8GB RAM, 64GB disk
limactl start --name=openarm --cpus=4 --memory=8 --disk=64 template://ubuntu-22.04
```

This takes ~2 minutes.

#### Step 3: Provision ROS 2 and Build Workspace

```bash
# This installs ROS 2 Humble and builds the OpenArm workspace
# Takes ~30 minutes on first run
limactl shell openarm bash -s < scripts/provision-ros2.sh
```

#### Step 4: Launch the Demo

```bash
just demo
```

When you see `"CONNECT Foxglove now"`:

1. Open Foxglove Studio
2. Click "Open Connection"
3. Enter `ws://localhost:8765`
4. Add a 3D panel
5. Watch both arms wiggle!

**Stop the demo:** Press `Ctrl+C` in the terminal

---

### Option 3: Full Platform (Website + Robot)

Run both components together for the complete experience.

1. **Terminal 1:** Start the website
   ```bash
   cd 2arm/website
   npm run dev
   ```

2. **Terminal 2:** Start Python backend
   ```bash
   cd 2arm/website/python-backend
   python main.py
   ```

3. **Terminal 3:** Start robot simulation
   ```bash
   cd 2arm/robot-training
   just demo
   ```

4. **Open:**
   - Website: http://localhost:3000
   - Foxglove: ws://localhost:8765

---

## 📖 Detailed Documentation

### Website Documentation
- **[Complete Website Guide](./website/README.md)** - Full setup and features
- **[API Documentation](./website/API.md)** - REST API endpoints
- **[Training Data Guide](./website/TRAINING_DATA_GUIDE.md)** - Data collection workflow
- **[Trajectory Tracking](./website/docs/TRAJECTORY_TRACKING.md)** - MediaPipe integration details

### Robot Training Documentation
- **[Robot Getting Started](./robot-training/docs/GETTING-STARTED.md)** - Complete setup guide
- **[Camera Setup](./robot-training/cameras/README.md)** - Vision system calibration
- **[Hardware Guide](./robot-training/HARDWARE.md)** - Physical robot deployment
- **[Calibration](./robot-training/CALIBRATION.md)** - Motor calibration procedures

---

## 📁 Repository Structure

```
2arm/
├── website/                    # Web platform
│   ├── app/                   # Next.js app directory
│   │   ├── api/              # API routes
│   │   ├── dashboard/        # Main application pages
│   │   └── login/            # Authentication
│   ├── components/            # React components
│   │   ├── gallery/          # Video gallery UI
│   │   ├── trajectory/       # Trajectory visualization
│   │   └── upload/           # Upload interface
│   ├── lib/                   # Utilities
│   │   ├── mediapipe/        # Hand tracking integration
│   │   ├── supabase.ts       # Database client
│   │   └── trajectory/       # Trajectory processing
│   ├── python-backend/        # MediaPipe API server
│   │   ├── main.py           # FastAPI server
│   │   └── humanego/         # Hand tracking processor
│   ├── supabase/              # Database schema
│   │   └── migrations/       # SQL migrations
│   └── public/                # Static assets
│
├── robot-training/            # Robot simulation & control
│   ├── cameras/              # Camera calibration & vision
│   ├── scripts/              # Motion demos & utilities
│   │   ├── wiggle.py        # Simple motion test
│   │   ├── macarena.py      # Complex demo
│   │   └── provision-ros2.sh # ROS 2 setup
│   ├── docs/                 # Robot documentation
│   ├── config.yaml           # Robot configuration
│   └── justfile              # Task runner commands
│
└── README.md                  # This file
```

---

## 🎮 Usage Examples

### Example 1: Record and Process a Training Video

1. Open http://localhost:3000 and sign in
2. Navigate to **Data** page
3. Click **Upload Video**
4. Select a video of a manual task (or record with Ray-Ban Meta)
5. The platform automatically:
   - Extracts frames at 30 FPS
   - Tracks hand movements in 3D
   - Generates trajectory data
   - Creates a thumbnail
6. View the processed trajectories in the gallery

### Example 2: Publish a Model to Marketplace

1. From the **Data** page, select a processed video
2. Click the **Publish** button
3. Choose a category:
   - Pick & Place
   - Welding
   - Assembly
   - Packaging
   - Inspection
4. Set a price (or mark as free)
5. Your model appears in **Marketplace** with a gradient illustration
6. Others can download the training dataset as JSON

### Example 3: Test in Robot Simulation

1. Start the robot: `just demo`
2. Connect Foxglove to `ws://localhost:8765`
3. Watch the bimanual arms perform:
   - Wiggle test (simple joint movements)
   - Macarena (complex coordinated motion)
   - Drumbeat (bimanual coordination)
4. Load your training data to test custom motions

---

## 🛠️ Technology Stack

### Website
| Category | Technology | Purpose |
|----------|-----------|---------|
| Framework | Next.js 16 | React framework with Turbopack |
| Language | TypeScript | Type-safe JavaScript |
| Database | Supabase (PostgreSQL) | Video metadata & trajectories |
| Storage | Supabase Storage | Video files & thumbnails |
| Auth | NextAuth.js | User authentication |
| Hand Tracking | MediaPipe Hands | 21-point 3D hand landmarks |
| Backend API | FastAPI (Python) | MediaPipe processing server |
| UI Framework | Tailwind CSS | Utility-first styling |
| Animations | Framer Motion | Smooth UI animations |
| State | Zustand | Lightweight state management |

### Robot Training
| Category | Technology | Purpose |
|----------|-----------|---------|
| Robot OS | ROS 2 Humble | Robot Operating System |
| Motion Planning | MoveIt 2 | Collision-free path planning |
| Control | ros2_control | Real-time robot control |
| Simulation | Gazebo / fake hardware | Robot testing without hardware |
| Visualization | Foxglove Studio | 3D robot visualization |
| VM | Lima (Ubuntu 22.04) | ROS 2 on macOS |
| Robot Model | OpenArm (dual 7-DOF) | Bimanual manipulation |
| Task Runner | Just | Command shortcuts |

---

## 🔒 Security & Privacy

### What's Safe to Share
- ✅ All code in this repository
- ✅ `.env.example` files (templates only)
- ✅ Database schema (migrations)
- ✅ README and documentation

### What's NOT in This Repo
- ❌ Real API keys (Supabase, Meta, etc.)
- ❌ User credentials
- ❌ Uploaded video files
- ❌ Production secrets

### Security Notes
- All `.env.local` files are gitignored
- Service role keys are never committed
- Demo login (admin/admin) is for development only
- CORS is restricted to localhost in development

---

## 🤝 Contributing

This project was created for a hackathon. Future contributions are welcome!

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test locally (run `npm run dev` for website, `just demo` for robot)
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

---

## 🏆 Hackathon Team

- **Developer:** Ivoine Strachan
- **Project Type:** Solo hackathon submission
- **Timeline:** All code committed during hackathon period
- **Technologies:** Next.js, ROS 2, MediaPipe, Supabase

---

## 📄 License

This project is open source and available under the MIT License.

---

## 🐛 Known Issues & Future Work

### Current Limitations
- Hand tracking requires good lighting conditions
- Robot simulation only (physical hardware requires additional CAN setup)
- Demo credit system is non-functional (for demonstration purposes)
- Ray-Ban Meta integration requires API access

### Planned Features
- [ ] Real-time collaborative editing of training data
- [ ] Advanced trajectory optimization algorithms
- [ ] Multi-robot coordination and synchronization
- [ ] Physical robot deployment on real OpenArm hardware
- [ ] Mobile app for on-the-go video recording
- [ ] Integration with more smart glasses platforms
- [ ] Export to multiple robot formats (Universal Robots, FANUC, etc.)

---

## 📞 Support & Questions

### Getting Help

1. **Check the documentation** in `/website/docs` and `/robot-training/docs`
2. **Review the READMEs** in each subdirectory
3. **Open an issue** on GitHub with:
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable

### Common Issues

**Website won't start:**
- Check that `.env.local` exists with valid Supabase credentials
- Verify Node.js version: `node --version` (need 18+)
- Clear cache: `rm -rf .next && npm run dev`

**Robot simulation not connecting:**
- Ensure Lima VM is running: `limactl list`
- Check Foxglove is connecting to the right port (8765)
- Verify ROS 2 workspace is built: `limactl shell openarm`

**Hand tracking not working:**
- Ensure Python backend is running on port 8000
- Check MediaPipe dependencies: `pip install -r requirements.txt`
- Verify video has clear views of hands

---

## 🙏 Credits & Acknowledgments

- **OpenArm Project:** Robot hardware design and ROS 2 integration
- **Briareus:** Base bimanual OpenArm simulation system
- **MediaPipe:** Google's hand tracking solution
- **Supabase:** Open source Firebase alternative
- **Foxglove:** Robot visualization platform
- **Design Inspiration:** Apple macOS design system

---

**Built with ❤️ for advancing industrial robotics through human demonstration**

*Making robots learn from humans, not the other way around.*
