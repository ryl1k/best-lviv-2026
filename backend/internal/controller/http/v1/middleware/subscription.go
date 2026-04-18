package middleware

import (
	"errors"

	"github.com/labstack/echo/v5"
	"github.com/ryl1k/best-lviv-2026/internal/dto"
	"github.com/ryl1k/best-lviv-2026/internal/dto/httpresponse"
	"github.com/ryl1k/best-lviv-2026/internal/entity"
)

// WithSubscription checks that the authenticated user has an active subscription with tier >= minTier
// and has tries remaining for the given resource. Must be chained after WithJWT.
func (m *Middleware) WithSubscription(minTier entity.SubscriptionTier, resource entity.SubscriptionResource) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c *echo.Context) error {
			l := m.logger.With("method", "with_subscription", "min_tier", minTier, "resource", resource)

			userClaims, ok := c.Get(entity.UserKey).(dto.UserClaims)
			if !ok {
				l.Warn("missing user claims in context")
				return httpresponse.NewErrorResponse(c, entity.ErrMissingAuthHeader)
			}

			userSub, err := m.subscriptionUseCase.GetUserSubscription(c.Request().Context(), userClaims.UserID)
			if err != nil {
				if errors.Is(err, entity.ErrNoActiveSubscription) {
					l.Warn("no active subscription", "user_id", userClaims.UserID)
					return httpresponse.NewErrorResponse(c, entity.ErrNoActiveSubscription)
				}
				l.Error("failed to get user subscription", "error", err)
				return httpresponse.NewErrorResponse(c, err)
			}

			if userSub.Subscription == nil || userSub.Subscription.Tier.Level() < minTier.Level() {
				l.Warn("insufficient tier", "user_id", userClaims.UserID, "has", userSub.Subscription.Tier, "required", minTier)
				return httpresponse.NewErrorResponse(c, entity.ErrInsufficientTier)
			}

			if !userSub.HasTriesRemaining(resource) {
				l.Warn("no tries remaining", "user_id", userClaims.UserID, "resource", resource)
				return httpresponse.NewErrorResponse(c, entity.ErrNoTriesRemaining)
			}

			return next(c)
		}
	}
}
