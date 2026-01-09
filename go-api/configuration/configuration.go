package configuration

import "github.com/ilyakaznacheev/cleanenv"

type (
	PgConnection struct {
		Host     string `yaml:"host" env-default:"localhost"`
		Port     string `yaml:"port" env-default:"5432"`
		User     string `yaml:"user" env-default:"postgres"`
		Password string `yaml:"password" env-default:"postgres"`
		Database string `yaml:"database" env-default:"postgres"`
	}
	KeycloakConfig struct {
		Issuer       string `yaml:"issuer" env-default:"http://localhost:8080/realms/myrealm"`
		ClientID     string `yaml:"client_id" env-default:"spa-client"`
		ClientSecret string `yaml:"client_secret" env-default:""`
	}

	KeycloakAdminConfig struct {
		ClientID     string `yaml:"admin_client_id" env-default:"admin-service"`
		ClientSecret string `yaml:"admin_client_secret" env-default:""`
	}

	Configuration struct {
		Api              ApiCfg              `yaml:"apiCfg" json:"api_cfg"`
		PostgresCfg      []PgConnection      `yaml:"postgresCfg" json:"postgres_cfg"`
		SqliteCfg        SqliteCfg           `yaml:"sqliteCfg" json:"sqlite_cfg"`
		VictoriaCfg      VictoriaCfg         `yaml:"victoriaCfg" json:"victoria_cfg"`
		ForecastCfg      ForecastCfg         `yaml:"forecastCfg" json:"forecast_cfg"`
		KeycloakCfg      KeycloakConfig      `yaml:"keycloakCfg" json:"keycloak_cfg"`
		KeycloakAdminCfg KeycloakAdminConfig `yaml:"keycloakAdminCfg" json:"keycloak_admin_cfg"`
	}

	ApiCfg struct {
		Host string `yaml:"host" env-default:"localhost"`
		Port string `yaml:"port" env-default:"8080"`
	}

	SqliteCfg struct {
		Path string `yaml:"path" env-default:"./db"`
	}

	VictoriaCfg struct {
		URL string `yaml:"url" env-default:"localhost"`
	}

	ForecastCfg struct {
		URL string `yaml:"url" env-default:"http://localhost:8082"`
	}

	LoggingCfg struct {
		Level string `yaml:"level" env-default:"debug"`
	}
)

func InitConfiguration(path string) (Configuration, error) {
	var (
		cfg Configuration
	)
	err := cleanenv.ReadConfig(path, &cfg)
	if err != nil {
		return Configuration{}, err
	}
	return cfg, err
}
