package utils

import (
	"testing"
)

func TestCustomSum(t *testing.T) {
	type args struct {
		a int
		b int
	}

	tests := []struct {
		name string
		args args
		want int
	}{
		{
			name: "123",
			args: args{
				a: 123,
				b: 1,
			},
			want: 124,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := CustomSum(tt.args.a, tt.args.b); got != tt.want {
				t.Errorf("CustomSum() = %v, want %v", got, tt.want)
			}
		})
	}
}
