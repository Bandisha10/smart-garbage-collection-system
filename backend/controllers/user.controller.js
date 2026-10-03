import User from '../models/User.model.js'
import Panchayat from '../models/Panchayat.model.js'

// Get all users for a panchayat
export const getUsers = async (req, res) => {
  try {
    const panchayatId = req.user.panchayatId
    const users = await User.find({ panchayat: panchayatId })

    // Include the main Panchayat Admin account
    const panchayat = await Panchayat.findById(panchayatId)
    if (panchayat) {
      // Add to beginning of list
      users.unshift({
        _id: panchayat._id,
        name: `${panchayat.name} (Admin)`,
        mobile: panchayat.contactPhone,
        email: panchayat.contactEmail,
        role: 'ADMIN',
        isActive: panchayat.status === 'active',
        isMainAccount: true,
      })
    }

    res.json(users)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Create a new user
export const createUser = async (req, res) => {
  try {
    const { name, mobile, email, role, permissions, isActive } = req.body
    const panchayatId = req.user.panchayatId

    if (!name || !email || !mobile) {
      return res.status(400).json({ message: 'Name, email, and mobile are required' })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' })
    }

    // Mobile validation
    const mobileRegex = /^\d{10}$/
    if (!mobileRegex.test(mobile)) {
      return res.status(400).json({ message: 'Mobile number must be 10 digits' })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ mobile })
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' })
    }

    let profilePhoto = ''
    if (req.file) {
      const serverBase = process.env.BACKEND_URL || 'https://smartgarbageserver.kamsoft.co.in'
      profilePhoto = `${serverBase.replace(/\/$/, '')}/uploads/${req.file.filename}`
    }

    const newUser = new User({
      name,
      mobile,
      email,
      role,
      permissions,
      isActive,
      panchayat: panchayatId,
      profilePhoto,
    })

    await newUser.save()
    res.status(201).json(newUser)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// Update user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params
    const { name, mobile, email, role, permissions, isActive } = req.body

    if (!name || !email || !mobile) {
      return res.status(400).json({ message: 'Name, email, and mobile are required' })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' })
    }

    // Mobile validation
    const mobileRegex = /^\d{10}$/
    if (!mobileRegex.test(mobile)) {
      return res.status(400).json({ message: 'Mobile number must be 10 digits' })
    }

    // Check if another user already has this mobile number
    const existingUser = await User.findOne({ mobile, _id: { $ne: id } })
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' })
    }

    let updateData = { name, mobile, email, role, permissions, isActive }
    if (req.file) {
      const serverBase = process.env.BACKEND_URL || 'https://smartgarbageserver.kamsoft.co.in'
      updateData.profilePhoto = `${serverBase.replace(/\/$/, '')}/uploads/${req.file.filename}`
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true })

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json(updatedUser)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// Delete (Deactivate) user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params
    const user = await User.findByIdAndDelete(id)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({ message: 'User deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
