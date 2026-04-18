package entity

import "errors"

var (
	ErrBadRequest              = errors.New("bad request")
	ErrMissingAuthHeader       = errors.New("missing auth header")
	ErrInvalidCredentials      = errors.New("invalid username or password")
	ErrInvalidToken            = errors.New("invalid token")
	ErrUserNotFound            = errors.New("user not found")
	ErrInvalidPaginationParams = errors.New("invalid pagination params")
	ErrNotFound                = errors.New("not found")
	ErrNoSuppliersAvailable    = errors.New("no suppliers available for rebalancing")
	ErrAlreadyResolved         = errors.New("alert or proposal already resolved")
	ErrForbidden               = errors.New("forbidden")
	ErrInvalidStatusTransition = errors.New("invalid status transition")
	ErrInsufficientStock       = errors.New("insufficient stock to fully satisfy request")
	ErrTaskNotFound            = errors.New("task not found")
	ErrDiscrepancyNotFound     = errors.New("discrepancy not found")
	ErrInvalidResolutionStatus = errors.New("invalid resolution status")
	ErrUnsupportedFileFormat   = errors.New("unsupported file format, use xlsx or csv")
	ErrSubscriptionNotFound    = errors.New("subscription not found")
	ErrAlreadySubscribed       = errors.New("user already has an active subscription this month")
	ErrInsufficientTier        = errors.New("subscription tier is insufficient for this operation")
	ErrNoTriesRemaining        = errors.New("no tries remaining for this operation")
	ErrNoActiveSubscription    = errors.New("no active subscription")
	ErrNotConfigured           = errors.New("feature not configured")
)
