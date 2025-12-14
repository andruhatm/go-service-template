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
		Issuer       string `yaml:"issuer" env-default:"http://localhost:8080"`
		ClientID     string `yaml:"client_id" env-default:"spa-client"`
		ClientSecret string `yaml:"client_secret" env-default:"123"`
	}

	Configuration struct {
		Api         ApiCfg         `json:"apiCfg"`
		PostgresCfg PostgresCfg    `json:"postgresCfg"`
		SqliteCfg   SqliteCfg      `json:"sqliteCfg"`
		VictoriaCfg VictoriaCfg    `json:"victoriaCfg"`
		KeycloakCfg KeycloakConfig `json:"keycloakCfg"`
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

	PostgresCfg []PgConnection

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
