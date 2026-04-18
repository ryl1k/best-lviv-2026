package v1

import (
	"context"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v5"
	"github.com/ryl1k/best-lviv-2026/internal/dto"
	"github.com/ryl1k/best-lviv-2026/internal/dto/httpresponse"
	"github.com/ryl1k/best-lviv-2026/internal/entity"
)

type subscriptionUseCase interface {
	List(ctx context.Context) ([]entity.Subscription, error)
	Purchase(ctx context.Context, userID int, subscriptionID int64) (entity.UserSubscription, error)
	GetUserSubscription(ctx context.Context, userID int) (entity.UserSubscription, error)
}

type SubscriptionController struct {
	logger  *slog.Logger
	useCase subscriptionUseCase
}

func NewSubscriptionController(logger *slog.Logger, useCase subscriptionUseCase) *SubscriptionController {
	return &SubscriptionController{
		logger:  logger.WithGroup("subscription_controller"),
		useCase: useCase,
	}
}

// List godoc
// @Summary      List subscription plans
// @Description  Returns all available subscription plans.
// @Tags         Subscriptions
// @Produce      json
// @Success      200  {object}  httpresponse.Response{Data=[]entity.Subscription}
// @Failure      500  {object}  httpresponse.Response{}
// @Router       /v1/subscriptions [get]
func (c *SubscriptionController) List(ctx *echo.Context) error {
	subs, err := c.useCase.List(ctx.Request().Context())
	if err != nil {
		c.logger.Error("failed to list subscriptions", "error", err)
		return httpresponse.NewErrorResponse(ctx, err)
	}
	return httpresponse.NewSuccessResponse(ctx, subs, http.StatusOK)
}

// Purchase godoc
// @Summary      Purchase a subscription
// @Description  Buys a subscription plan for the authenticated user. Only one active subscription is allowed per month.
// @Tags         Subscriptions
// @Produce      json
// @Security     BearerAuth
// @Param        id   path      int  true  "Subscription plan ID"
// @Success      201  {object}  httpresponse.Response{Data=entity.UserSubscription}
// @Failure      400  {object}  httpresponse.Response{}
// @Failure      401  {object}  httpresponse.Response{}
// @Failure      409  {object}  httpresponse.Response{}
// @Router       /v1/subscriptions/{id}/purchase [post]
func (c *SubscriptionController) Purchase(ctx *echo.Context) error {
	userClaims := ctx.Get(entity.UserKey).(dto.UserClaims)

	idStr := ctx.Param("id")
	subscriptionID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return httpresponse.NewErrorResponse(ctx, entity.ErrBadRequest, "invalid subscription id")
	}

	l := c.logger.With("method", "purchase", "user_id", userClaims.UserID, "subscription_id", subscriptionID)

	userSub, err := c.useCase.Purchase(ctx.Request().Context(), userClaims.UserID, subscriptionID)
	if err != nil {
		l.Error("failed to purchase subscription", "error", err)
		return httpresponse.NewErrorResponse(ctx, err)
	}

	return httpresponse.NewSuccessResponse(ctx, userSub, http.StatusCreated)
}

// GetMine godoc
// @Summary      Get my active subscription
// @Description  Returns the current active subscription for the authenticated user.
// @Tags         Subscriptions
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  httpresponse.Response{Data=entity.UserSubscription}
// @Failure      401  {object}  httpresponse.Response{}
// @Failure      404  {object}  httpresponse.Response{}
// @Router       /v1/subscriptions/me [get]
func (c *SubscriptionController) GetMine(ctx *echo.Context) error {
	userClaims := ctx.Get(entity.UserKey).(dto.UserClaims)

	l := c.logger.With("method", "get_mine", "user_id", userClaims.UserID)

	userSub, err := c.useCase.GetUserSubscription(ctx.Request().Context(), userClaims.UserID)
	if err != nil {
		l.Error("failed to get user subscription", "error", err)
		return httpresponse.NewErrorResponse(ctx, err)
	}

	return httpresponse.NewSuccessResponse(ctx, userSub, http.StatusOK)
}
