import Joi from 'joi';

const phone    = Joi.string().pattern(/^[6-9]\d{9}$/).messages({ 'string.pattern.base': 'Enter a valid 10-digit Indian mobile number' });
const objectId = Joi.string().hex().length(24).messages({ 'string.length': 'Invalid ID', 'string.hex': 'Invalid ID' });

export const v = {

  // ── Gym ──
  createGym: Joi.object({
    name:    Joi.string().min(2).max(100).required().messages({ 'any.required': 'Gym name is required' }),
    phone:   Joi.string().pattern(/^\d{10}$/).optional().allow(''),
    city:    Joi.string().min(2).max(100).optional().allow(''),
    address: Joi.string().max(300).optional().allow(''),
    gstin:   Joi.string().optional().allow(''),
  }),

  updateGym: Joi.object({
    name:            Joi.string().min(2).max(100).optional(),
    phone:           Joi.string().pattern(/^\d{10}$/).optional().allow(''),
    city:            Joi.string().max(100).optional().allow(''),
    address:         Joi.string().max(300).optional().allow(''),
    gstin:           Joi.string().optional().allow(''),
    logoUrl:         Joi.string().uri().optional().allow(''),
    isSetupComplete: Joi.boolean().optional(),
  }),

  // ── Plans ──
  createPlan: Joi.object({
    name:            Joi.string().min(2).max(100).required().messages({ 'any.required': 'Plan name is required' }),
    durationDays:    Joi.number().integer().min(1).max(3650).required().messages({ 'any.required': 'Duration is required' }),
    price:           Joi.number().min(0).required().messages({ 'any.required': 'Price is required' }),
    gstRate:         Joi.number().min(0).max(28).default(18),
    description:     Joi.string().max(500).optional().allow(''),
    features:        Joi.array().items(Joi.string()).optional(),
    maxFreezeDays:   Joi.number().integer().min(0).default(30),
    includesClasses: Joi.boolean().default(false),
  }),

  updatePlan: Joi.object({
    name:            Joi.string().min(2).max(100).optional(),
    durationDays:    Joi.number().integer().min(1).optional(),
    price:           Joi.number().min(0).optional(),
    gstRate:         Joi.number().min(0).max(28).optional(),
    description:     Joi.string().max(500).optional().allow(''),
    features:        Joi.array().items(Joi.string()).optional(),
    isActive:        Joi.boolean().optional(),
    maxFreezeDays:   Joi.number().integer().min(0).optional(),
    includesClasses: Joi.boolean().optional(),
  }),

  // ── Members ──
  createMember: Joi.object({
    phone:        phone.required().messages({ 'any.required': 'Phone number is required' }),
    fullName:     Joi.string().min(2).max(100).required().messages({ 'any.required': 'Full name is required' }),
    email:        Joi.string().email().optional().allow(''),
    planId:       objectId.optional(),
    planName:     Joi.string().max(100).optional().allow(''),
    planStartDate:Joi.string().isoDate().optional(),
    planEndDate:  Joi.string().isoDate().optional(),
    healthNotes:  Joi.string().max(500).optional().allow(''),
    fitnessGoals: Joi.array().items(Joi.string()).optional(),
    emergencyContact: Joi.object({
      name:     Joi.string().required(),
      phone:    Joi.string().required(),
      relation: Joi.string().required(),
    }).optional(),
  }),

  updateMember: Joi.object({
    fullName:     Joi.string().min(2).max(100).optional(),
    email:        Joi.string().email().optional().allow(''),
    status:       Joi.string().valid('active','expired','frozen','cancelled').optional(),
    planName:     Joi.string().optional().allow(''),
    planEndDate:  Joi.string().isoDate().optional(),
    planStartDate:Joi.string().isoDate().optional(),
    healthNotes:  Joi.string().max(500).optional().allow(''),
    fitnessGoals: Joi.array().items(Joi.string()).optional(),
    trainerId:    objectId.optional(),
    emergencyContact: Joi.object({
      name:     Joi.string().required(),
      phone:    Joi.string().required(),
      relation: Joi.string().required(),
    }).optional(),
  }),

  checkin: Joi.object({
    method: Joi.string().valid('qr','manual','rfid').default('manual'),
  }),

  // ── Payments ──
  createInvoice: Joi.object({
    memberId:       objectId.required().messages({ 'any.required': 'Member ID is required' }),
    subtotal:       Joi.number().min(0).required().messages({ 'any.required': 'Amount is required' }),
    gstRate:        Joi.number().min(0).max(28).default(18),
    discountAmount: Joi.number().min(0).default(0),
    planName:       Joi.string().optional().allow(''),
    notes:          Joi.string().max(500).optional().allow(''),
    dueDate:        Joi.string().isoDate().optional(),
  }),

  recordPayment: Joi.object({
    paymentMode: Joi.string().valid('cash','upi','card','bank').required()
                  .messages({ 'any.required': 'Payment mode is required', 'any.only': 'Invalid payment mode' }),
    extendDays:  Joi.number().integer().min(1).optional(),
  }),

  createRazorpayOrder: Joi.object({
    memberId:   objectId.required(),
    amount:     Joi.number().min(1).required().messages({ 'any.required': 'Amount is required' }),
    planName:   Joi.string().required().messages({ 'any.required': 'Plan name is required' }),
    extendDays: Joi.number().integer().min(1).required().messages({ 'any.required': 'Extend days is required' }),
  }),

  verifyPayment: Joi.object({
    razorpayOrderId:   Joi.string().required(),
    razorpayPaymentId: Joi.string().required(),
    razorpaySignature: Joi.string().required(),
    invoiceId:         objectId.required(),
    extendDays:        Joi.number().integer().min(1).required(),
  }),

  // ── Staff ──
  inviteStaff: Joi.object({
    phone:    phone.required().messages({ 'any.required': 'Phone number is required' }),
    role:     Joi.string().valid('manager','trainer','front_desk','accounts').required()
               .messages({ 'any.required': 'Role is required', 'any.only': 'Invalid role. Must be manager, trainer, front_desk or accounts' }),
    fullName: Joi.string().min(2).max(100).optional().allow(''),
  }),

  updateStaffRole: Joi.object({
    role: Joi.string().valid('manager','trainer','front_desk','accounts').required()
           .messages({ 'any.required': 'Role is required', 'any.only': 'Invalid role' }),
  }),

  // ── Notifications ──
  broadcast: Joi.object({
    title:   Joi.string().min(1).max(100).required().messages({ 'any.required': 'Title is required' }),
    message: Joi.string().min(1).max(500).required().messages({ 'any.required': 'Message is required' }),
  }),

  // ── Admin ──
  updateGymStatus: Joi.object({
    status: Joi.string().valid('active','trial','suspended','churned').required()
             .messages({ 'any.required': 'Status is required', 'any.only': 'Invalid status' }),
  }),

  updateGymPlan: Joi.object({
    planTier: Joi.string().valid('starter','growth','enterprise').required()
               .messages({ 'any.required': 'Plan tier is required', 'any.only': 'Invalid plan tier' }),
  }),

  createUser: Joi.object({
    phone:      phone.required().messages({ 'any.required': 'Phone number is required' }),
    fullName:   Joi.string().min(2).max(100).required().messages({ 'any.required': 'Full name is required' }),
    email:      Joi.string().email().optional().allow(''),
    systemRole: Joi.string().valid('super_admin','gym_owner','staff','member').required()
                 .messages({ 'any.required': 'System role is required', 'any.only': 'Invalid system role' }),
  }),

  updateUserRole: Joi.object({
    systemRole: Joi.string().valid('super_admin','gym_owner','staff','member').optional()
                 .messages({ 'any.only': 'Invalid system role' }),
    isActive:   Joi.boolean().optional(),
  }).or('systemRole', 'isActive').messages({ 'object.missing': 'Provide systemRole or isActive' }),

  createGymOwner: Joi.object({
    phone:    phone.required().messages({ 'any.required': 'Phone number is required' }),
    fullName: Joi.string().min(2).max(100).required().messages({ 'any.required': 'Owner name is required' }),
    email:    Joi.string().email().optional().allow(''),
    gymName:  Joi.string().min(2).max(100).required().messages({ 'any.required': 'Gym name is required' }),
    city:     Joi.string().min(2).max(100).optional().allow(''),
    gymPhone: Joi.string().pattern(/^\d{10}$/).optional().allow(''),
    address:  Joi.string().max(300).optional().allow(''),
  }),

  assignStaffRole: Joi.object({
    userId: objectId.required().messages({ 'any.required': 'User ID is required' }),
    gymId:  objectId.required().messages({ 'any.required': 'Gym ID is required' }),
    role:   Joi.string().valid('manager','trainer','front_desk','accounts').required()
             .messages({ 'any.required': 'Role is required', 'any.only': 'Invalid role' }),
  }),
};