const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { generateTokens, verifyRefresh } = require('../utils/jwt');
const ApiError = require('../utils/apiError');

const SALT_ROUNDS = 10;

/**
 * Register a new business + owner account
 */
async function register({ name, email, password, businessName }) {
  const existing = await prisma.business.findUnique({ where: { ownerEmail: email } });
  if (existing) throw ApiError.conflict('Email already registered');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const business = await prisma.business.create({
    data: {
      name: businessName || name,
      ownerEmail: email,
      passwordHash,
    },
  });

  const tokens = generateTokens(business.id, business.id);

  return {
    user: {
      id:             business.id,
      name:           business.name,
      email:          business.ownerEmail,
      role:           'admin',
      avatarInitials: name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
      businessId:     business.id,
      business: {
        id:   business.id,
        name: business.name,
        plan: business.plan,
      },
    },
    ...tokens,
  };
}

/**
 * Login with email + password
 */
async function login({ email, password }) {
  const business = await prisma.business.findUnique({ where: { ownerEmail: email } });
  if (!business) throw ApiError.unauthorized('Invalid email or password');

  const valid = await bcrypt.compare(password, business.passwordHash);
  if (!valid) throw ApiError.unauthorized('Invalid email or password');

  const tokens = generateTokens(business.id, business.id);

  return {
    user: {
      id:             business.id,
      name:           business.name,
      email:          business.ownerEmail,
      role:           'admin',
      avatarInitials: business.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
      businessId:     business.id,
      business: {
        id:   business.id,
        name: business.name,
        plan: business.plan,
      },
    },
    ...tokens,
  };
}

/**
 * Refresh access token using refresh token
 */
async function refreshToken(token) {
  try {
    const payload = verifyRefresh(token);
    const tokens = generateTokens(payload.userId, payload.businessId);
    return tokens;
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }
}

/**
 * Get current user profile
 */
async function getProfile(businessId) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      _count: { select: { leads: true, campaigns: true } },
    },
  });

  if (!business) throw ApiError.notFound('Business not found');

  return {
    id:             business.id,
    name:           business.name,
    email:          business.ownerEmail,
    role:           'admin',
    avatarInitials: business.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
    businessId:     business.id,
    business: {
      id:         business.id,
      name:       business.name,
      plan:       business.plan,
      waNumber:   business.waNumber,
      leadCount:  business._count.leads,
      campaignCount: business._count.campaigns,
    },
  };
}

/**
 * Update current user profile
 */
async function updateProfile(businessId, updates) {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) throw ApiError.notFound('Business not found');

  const updateData = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.email !== undefined) {
    // Check if email already exists on a different business
    const existing = await prisma.business.findFirst({
      where: { ownerEmail: updates.email, id: { not: businessId } }
    });
    if (existing) throw ApiError.conflict('Email already in use');
    updateData.ownerEmail = updates.email;
  }

  const updatedBusiness = await prisma.business.update({
    where: { id: businessId },
    data: updateData,
    include: {
      _count: { select: { leads: true, campaigns: true } },
    },
  });

  return {
    id:             updatedBusiness.id,
    name:           updatedBusiness.name,
    email:          updatedBusiness.ownerEmail,
    role:           'admin',
    avatarInitials: updatedBusiness.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
    businessId:     updatedBusiness.id,
    business: {
      id:         updatedBusiness.id,
      name:       updatedBusiness.name,
      plan:       updatedBusiness.plan,
      waNumber:   updatedBusiness.waNumber,
      leadCount:  updatedBusiness._count.leads,
      campaignCount: updatedBusiness._count.campaigns,
    },
  };
}

module.exports = { register, login, refreshToken, getProfile, updateProfile };
