"use client"

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export interface Waypoint {
  timestamp: number
  position: { x: number; y: number; z: number }
  orientation?: { roll: number; pitch: number; yaw: number }
  gripperState?: 'open' | 'closed' | 'partial'
  taskPhase?: string
}

interface TrajectoryVisualizationProps {
  waypoints: Waypoint[]
  width?: number
  height?: number
  showArrows?: boolean
  showGripperStates?: boolean
  colorByPhase?: boolean
}

export default function TrajectoryVisualization({
  waypoints,
  width = 800,
  height = 600,
  showArrows = true,
  showGripperStates = true,
  colorByPhase = true
}: TrajectoryVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const trajectoryGroupRef = useRef<THREE.Group | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentFrame, setCurrentFrame] = useState(0)

  useEffect(() => {
    if (!containerRef.current) return

    // Initialize scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0a)
    sceneRef.current = scene

    // Initialize camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.set(2, 2, 2)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // Initialize renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controlsRef.current = controls

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 5, 5)
    scene.add(directionalLight)

    // Add grid
    const gridHelper = new THREE.GridHelper(4, 20, 0x444444, 0x222222)
    scene.add(gridHelper)

    // Add axes helper
    const axesHelper = new THREE.AxesHelper(1)
    scene.add(axesHelper)

    // Create trajectory group
    const trajectoryGroup = new THREE.Group()
    scene.add(trajectoryGroup)
    trajectoryGroupRef.current = trajectoryGroup

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Cleanup
    return () => {
      renderer.dispose()
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement)
      }
    }
  }, [width, height])

  // Update trajectory when waypoints change
  useEffect(() => {
    if (!trajectoryGroupRef.current || waypoints.length === 0) return

    const trajectoryGroup = trajectoryGroupRef.current

    // Clear existing trajectory
    while (trajectoryGroup.children.length > 0) {
      trajectoryGroup.remove(trajectoryGroup.children[0])
    }

    // Color mapping for task phases
    const phaseColors: Record<string, number> = {
      reach: 0x4ade80, // green
      grasp: 0xfbbf24, // yellow
      transport: 0x60a5fa, // blue
      place: 0xf97316, // orange
      retract: 0xa78bfa // purple
    }

    // Create trajectory line
    const points: THREE.Vector3[] = waypoints.map(
      (wp) => new THREE.Vector3(wp.position.x, wp.position.y, wp.position.z)
    )

    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points)
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x4ade80,
      linewidth: 2
    })
    const line = new THREE.Line(lineGeometry, lineMaterial)
    trajectoryGroup.add(line)

    // Add waypoint markers
    waypoints.forEach((wp, i) => {
      const color = colorByPhase && wp.taskPhase
        ? phaseColors[wp.taskPhase] || 0x4ade80
        : 0x4ade80

      // Waypoint sphere
      const sphereGeometry = new THREE.SphereGeometry(0.02, 16, 16)
      const sphereMaterial = new THREE.MeshStandardMaterial({ color })
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
      sphere.position.set(wp.position.x, wp.position.y, wp.position.z)
      trajectoryGroup.add(sphere)

      // Direction arrow (showing velocity/direction to next point)
      if (showArrows && i < waypoints.length - 1) {
        const nextWp = waypoints[i + 1]
        const direction = new THREE.Vector3(
          nextWp.position.x - wp.position.x,
          nextWp.position.y - wp.position.y,
          nextWp.position.z - wp.position.z
        ).normalize()

        const arrowLength = 0.1
        const arrow = new THREE.ArrowHelper(
          direction,
          new THREE.Vector3(wp.position.x, wp.position.y, wp.position.z),
          arrowLength,
          color,
          0.02,
          0.02
        )
        trajectoryGroup.add(arrow)
      }

      // Gripper state indicator
      if (showGripperStates && wp.gripperState) {
        const gripperColor =
          wp.gripperState === 'closed' ? 0xff0000 :
          wp.gripperState === 'partial' ? 0xffff00 :
          0x00ff00

        const gripperGeometry = new THREE.BoxGeometry(0.03, 0.03, 0.03)
        const gripperMaterial = new THREE.MeshStandardMaterial({ color: gripperColor })
        const gripperBox = new THREE.Mesh(gripperGeometry, gripperMaterial)
        gripperBox.position.set(wp.position.x, wp.position.y + 0.05, wp.position.z)
        trajectoryGroup.add(gripperBox)
      }
    })

    // Center camera on trajectory
    if (points.length > 0) {
      const box = new THREE.Box3().setFromPoints(points)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())
      const maxDim = Math.max(size.x, size.y, size.z)

      if (cameraRef.current && controlsRef.current) {
        cameraRef.current.position.set(
          center.x + maxDim * 1.5,
          center.y + maxDim * 1.5,
          center.z + maxDim * 1.5
        )
        controlsRef.current.target.copy(center)
        controlsRef.current.update()
      }
    }
  }, [waypoints, showArrows, showGripperStates, colorByPhase])

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setCurrentFrame((prev) => {
        if (prev >= waypoints.length - 1) {
          setIsPlaying(false)
          return 0
        }
        return prev + 1
      })
    }, 100)

    return () => clearInterval(interval)
  }, [isPlaying, waypoints.length])

  return (
    <div className="flex flex-col gap-4">
      <div
        ref={containerRef}
        className="relative rounded-lg overflow-hidden border border-slate-800"
        style={{ width, height }}
      />

      <div className="flex items-center gap-4 px-4">
        <button
          onClick={handlePlayPause}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>

        <input
          type="range"
          min={0}
          max={waypoints.length - 1}
          value={currentFrame}
          onChange={(e) => setCurrentFrame(parseInt(e.target.value))}
          className="flex-1"
        />

        <span className="text-sm text-slate-400">
          Frame {currentFrame + 1} / {waypoints.length}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 px-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500" />
          <span className="text-slate-300">Reach</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-yellow-500" />
          <span className="text-slate-300">Grasp</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-500" />
          <span className="text-slate-300">Transport</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-orange-500" />
          <span className="text-slate-300">Place</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-purple-500" />
          <span className="text-slate-300">Retract</span>
        </div>
      </div>

      {waypoints.length > 0 && (
        <div className="px-4 text-sm text-slate-400">
          <p>Total waypoints: {waypoints.length}</p>
          <p>
            Duration: {(waypoints[waypoints.length - 1].timestamp / 1000).toFixed(2)}s
          </p>
        </div>
      )}
    </div>
  )
}
