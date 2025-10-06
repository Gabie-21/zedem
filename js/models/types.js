/**
 * Shared model typedefs for the Emergency Response System
 * These are JS JSDoc typedefs to enable IDE intellisense in plain JS.
 */

/** @typedef {('reporter'|'responder'|'guest')} UserType */
/** @typedef {('medical'|'fire'|'police'|'general')} EmergencyType */
/** @typedef {('critical'|'serious'|'moderate'|'minor')} Severity */
/** @typedef {('pending'|'responding'|'resolved'|'reported'|'dispatched')} EmergencyStatus */

/**
 * @typedef {Object} Location
 * @property {number} latitude
 * @property {number} longitude
 * @property {string} address
 * @property {string=} landmark
 */

/**
 * @typedef {Object} Reporter
 * @property {string=} name
 * @property {string=} phone
 * @property {boolean} canContact
 * @property {string=} userId
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {UserType} type
 * @property {string=} phone
 * @property {string=} email
 * @property {string=} name
 * @property {('hospital'|'police'|'fire'|'security')=} organization
 * @property {any} createdAt
 * @property {any} updatedAt
 */

/**
 * @typedef {Object} Emergency
 * @property {string} id
 * @property {EmergencyType} type
 * @property {Severity} severity
 * @property {EmergencyStatus} status
 * @property {string} description
 * @property {string} affectedPeople
 * @property {Location} location
 * @property {Reporter} reporter
 * @property {string[]=} images
 * @property {string=} responderId
 * @property {string=} responderNotes
 * @property {any} createdAt
 * @property {any} updatedAt
 */

/**
 * @typedef {Object} RescueCenter
 * @property {string} id
 * @property {string} name
 * @property {('hospital'|'police'|'fire'|'security')} type
 * @property {string} phone
 * @property {Location} location
 * @property {string[]} resources
 * @property {boolean} available
 * @property {number} responseTime
 * @property {any} createdAt
 * @property {any} updatedAt
 */

/**
 * @typedef {Object} ResponseRecord
 * @property {string} id
 * @property {string} emergencyId
 * @property {string} responderId
 * @property {string} rescueCenterId
 * @property {('dispatched'|'en-route'|'on-scene'|'completed')} status
 * @property {string=} notes
 * @property {any=} arrivalTime
 * @property {any=} completionTime
 * @property {any} createdAt
 * @property {any} updatedAt
 */
