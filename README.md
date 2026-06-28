# 2arm - Industrial Robot Motion Training Platform

A complete industrial robot training data platform combining a modern web interface for data collection and management with bimanual robot arm simulation and control.

## 🎯 What is 2arm?

2arm is an end-to-end platform for industrial robot motion training that bridges the gap between human demonstrations and robot execution. The platform consists of two main components:

1. **Web Platform** - A Next.js application for collecting, managing, and publishing training data from Ray-Ban Meta smart glasses
2. **Robot Training** - A ROS 2-based bimanual OpenArm robot simulation system for testing and deploying trained models

### Key Features

- 📹 **Smart Glasses Integration** - Record human demonstrations using Ray-Ban Meta glasses with real-time hand tracking
- 🎨 **Modern UI** - Clean, Apple-inspired interface with smooth animations and responsive design
- 🤖 **Bimanual Robot Sim** - Full ROS 2 simulation of dual 7-DOF arms with grippers
- 📊 **Training Data Management** - Organize, categorize, and publish motion datasets
- 🛒 **Model Marketplace** - Share and download trained models with demo credit system
- 🎯 **Trajectory Tracking** - MediaPipe-powered hand tracking for precise motion capture
- 🔄 **End-to-End Pipeline** - From human demo to robot execution

## 🏗️ Architecture

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
│                          │                                  │
│  User Flow:              │  Deployment Flow:                │
│  1. Record w/ glasses    │  1. Load training data          │
│  2. Upload to platform   │  2. Test in simulation          │
│  3. Track hands          │  3. Deploy to real robot        │
│  4. Publish model        │                                  │
└──────────────────────────┴──────────────────────────────────┘
```

## 📁 Repository Structure

```
2arm-monorepo/
├── website/              # Web platform (Next.js)
│   ├── app/             # Next.js app directory
│   ├── components/      # React components
│   ├── lib/             # Utilities & integrations
│   ├── python-backend/  # MediaPipe processing server
│   └── supabase/        # Database migrations
│
├── robot-training/       # Robot simulation & control
│   ├── cameras/         # Camera calibration & perception
│   ├── scripts/         # Motion demos & utilities
│   ├── docs/            # Robot setup documentation
│   └── config.yaml      # Robot configuration
│
└── README.md            # This file
```

## 🚀 Quick Start

### Prerequisites

**For Website:**
- Node.js 18+ and npm
- Supabase account (free tier works)
- Python 3.9+ (for MediaPipe backend)

**For Robot Training:**
- macOS (Apple Silicon recommended) or Linux
- Lima VM manager: `brew install lima`
- Just task runner: `brew install just`
- Foxglove Studio (from foxglove.dev)

### Installation

#### 1. Website Setup

```bash
cd website

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# Run database migrations
npm run db:migrate

# Start the development server
npm run dev
```

Visit `http://localhost:3000` to see the web platform.

**Python Backend (for hand tracking):**

```bash
cd website/python-backend
pip install -r requirements.txt
python main.py  # Runs on port 8000
```

#### 2. Robot Training Setup

```bash
cd robot-training

# Create and provision the VM (one-time setup)
limactl start --name=openarm --cpus=4 --memory=8 --disk=64 template://ubuntu-22.04

# Install ROS 2 and build workspace (one-time, ~30 min)
limactl shell openarm bash -s < scripts/provision-ros2.sh

# Launch the demo
just demo
```

When you see "CONNECT Foxglove now", open Foxglove Studio and connect to `ws://localhost:8765`.

## 📖 Detailed Documentation

### Website Documentation

- **[Website README](./website/README.md)** - Detailed setup and usage
- **[API Documentation](./website/API.md)** - REST API endpoints
- **[Training Data Guide](./website/TRAINING_DATA_GUIDE.md)** - Data collection workflow
- **[Trajectory Tracking](./website/docs/TRAJECTORY_TRACKING.md)** - MediaPipe integration

### Robot Training Documentation

- **[Getting Started](./robot-training/docs/GETTING-STARTED.md)** - Full setup guide
- **[Camera Setup](./robot-training/cameras/README.md)** - Perception kit calibration
- **[Hardware Guide](./robot-training/HARDWARE.md)** - Physical robot deployment
- **[Calibration](./robot-training/CALIBRATION.md)** - Motor calibration procedures

## 🎮 Usage Examples

### Recording a Training Video

1. Open the website at `http://localhost:3000`
2. Sign in (default: admin/admin for demo)
3. Navigate to **Data** page
4. Click **Upload Video** or use Ray-Ban Meta glasses to record
5. The system automatically:
   - Extracts frames
   - Tracks hand movements
   - Generates trajectories
   - Creates thumbnails

### Publishing a Model

1. Go to **Data** page and select a processed video
2. Click **Publish to Marketplace**
3. Choose a category (Pick & Place, Welding, etc.)
4. Set pricing (or free for demo)
5. Your model appears in the **Marketplace** for download

### Testing in Simulation

1. Start the robot simulation: `just demo`
2. Connect Foxglove to `ws://localhost:8765`
3. Load your training data
4. Watch the bimanual arms execute the motion

## 🛠️ Technology Stack

### Website
- **Framework:** Next.js 16 with Turbopack
- **Language:** TypeScript
- **Styling:** Tailwind CSS with custom design system
- **UI:** Framer Motion for animations
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage for videos
- **Auth:** NextAuth.js
- **Hand Tracking:** MediaPipe + Python FastAPI backend

### Robot Training
- **Robot OS:** ROS 2 Humble
- **Motion Planning:** MoveIt 2
- **Visualization:** Foxglove Studio, RViz
- **Robot Model:** Bimanual 7-DOF OpenArm
- **VM:** Lima (Ubuntu 22.04 on macOS)
- **Control:** ros2_control with fake/real hardware

## 🤝 Contributing

This project was created for a hackathon. Contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Environment Variables

### Website (.env.local)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key

# Meta API (optional)
META_API_KEY=your_meta_api_key
```

See `website/.env.local.example` for a complete template.

## 🔒 Security Notes

- **Never commit `.env.local`** - It contains sensitive API keys
- **Service role keys** are gitignored and should never be public
- **Demo credentials** (admin/admin) should be changed in production
- **CORS** is configured for localhost only by default

## 🏆 Credits

Created by Ivoine for the 2arm hackathon project.

- **Website Platform:** Built with Next.js, Supabase, and MediaPipe
- **Robot Training:** Based on [OpenArm](https://github.com/enactic/openarm_ros2) and [briareus](https://github.com/m2moiz/briareus)
- **Design Inspiration:** Apple macOS design system

## 📄 License

This project is open source and available under the MIT License.

## 🐛 Known Issues & Roadmap

### Current Limitations
- Hand tracking requires good lighting
- Robot simulation only (physical deployment requires CAN hardware)
- Demo credit system is fake (no real payment processing)

### Planned Features
- [ ] Real-time collaboration on training data
- [ ] Advanced trajectory optimization
- [ ] Multi-robot coordination
- [ ] Physical robot deployment guide
- [ ] Mobile app for on-the-go recording

## 📞 Support

For questions or issues:
- Open an issue on GitHub
- Check the documentation in `/website/docs` and `/robot-training/docs`
- Review the detailed READMEs in each subdirectory

---

**Built with ❤️ for advancing industrial robotics through human demonstration**
