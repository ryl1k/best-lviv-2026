package entity

import "time"

type SubscriptionTier string

const (
	TierOneShot SubscriptionTier = "ONESHOT"
	TierBasic   SubscriptionTier = "BASIC"
	TierPro     SubscriptionTier = "PRO"
)

func (t SubscriptionTier) Level() int {
	switch t {
	case TierOneShot:
		return 0
	case TierBasic:
		return 1
	case TierPro:
		return 2
	default:
		return -1
	}
}

type SubscriptionResource string

const (
	ResourceSatellite SubscriptionResource = "satellite"
	ResourceCSV       SubscriptionResource = "csv"
)

type Subscription struct {
	ID                int64            `json:"id"`
	Tier              SubscriptionTier `json:"tier"`
	Name              string           `json:"name"`
	PriceUAH          float64          `json:"price_uah"`
	MaxSatelliteTries int              `json:"max_satellite_tries"`
	MaxCSVTries       int              `json:"max_csv_tries"`
	CreatedAt         time.Time        `json:"created_at"`
	UpdatedAt         time.Time        `json:"updated_at"`
}

type UserSubscription struct {
	ID                 int64         `json:"id"`
	UserID             int           `json:"user_id"`
	SubscriptionID     int64         `json:"subscription_id"`
	Subscription       *Subscription `json:"subscription,omitempty"`
	SatelliteTriesUsed int           `json:"satellite_tries_used"`
	CSVTriesUsed       int           `json:"csv_tries_used"`
	StartsAt           time.Time     `json:"starts_at"`
	ExpiresAt          time.Time     `json:"expires_at"`
	CreatedAt          time.Time     `json:"created_at"`
}

func (us *UserSubscription) HasTriesRemaining(resource SubscriptionResource) bool {
	if us.Subscription == nil {
		return false
	}
	switch resource {
	case ResourceSatellite:
		return us.Subscription.MaxSatelliteTries == -1 || us.SatelliteTriesUsed < us.Subscription.MaxSatelliteTries
	case ResourceCSV:
		return us.Subscription.MaxCSVTries == -1 || us.CSVTriesUsed < us.Subscription.MaxCSVTries
	default:
		return false
	}
}

type SubscriptionTransaction struct {
	ID             int64     `json:"id"`
	UserID         int       `json:"user_id"`
	SubscriptionID int64     `json:"subscription_id"`
	AmountUAH      float64   `json:"amount_uah"`
	CreatedAt      time.Time `json:"created_at"`
}
