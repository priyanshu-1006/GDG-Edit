import jwt from 'jsonwebtoken';
import ImmerseAdmin from '../models/ImmerseAdmin.js';

const getImmerseJwtSecret = () => {
    const secret = process.env.IMMERSE_JWT_SECRET;
    if (!secret) {
        throw new Error('IMMERSE_JWT_SECRET is not configured');
    }
    return secret;
};

/**
 * Protect Immerse admin routes
 */
export const protectImmerse = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route'
        });
    }

    try {
        const immerseSecret = getImmerseJwtSecret();

        // Verify token with Immerse-specific secret
        const decoded = jwt.verify(token, immerseSecret);

        // Check if it's an Immerse admin token
        if (!decoded.isImmerseAdmin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token type'
            });
        }

        const admin = await ImmerseAdmin.findById(decoded.id);

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Admin not found'
            });
        }

        if (!admin.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Admin account is deactivated'
            });
        }

        req.immerseAdmin = admin;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route'
        });
    }
};

/**
 * Check if Immerse admin is super admin
 */
export const immerseSuperAdmin = (req, res, next) => {
    if (req.immerseAdmin.role !== 'immerse_super_admin') {
        return res.status(403).json({
            success: false,
            message: 'Only super admin can perform this action'
        });
    }
    next();
};

/**
 * Generate Immerse admin token
 */
export const generateImmerseToken = (admin) => {
    const immerseSecret = getImmerseJwtSecret();

    return jwt.sign(
        { 
            id: admin._id,
            isImmerseAdmin: true,
            role: admin.role
        },
        immerseSecret,
        { expiresIn: '7d' }
    );
};
