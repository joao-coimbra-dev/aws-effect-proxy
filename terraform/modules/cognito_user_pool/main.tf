terraform {
  required_version = "~> 1.14.3"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

resource "aws_cognito_user_pool" "pool" {
  name = var.user_pool_name

  auto_verified_attributes = ["email"]

  schema {
    name                     = "email"
    attribute_data_type      = "String"
    required                 = true
    mutable                  = false
  }
}

resource "aws_cognito_user_pool_client" "client" {
  name         = var.client_name
  user_pool_id = aws_cognito_user_pool.pool.id

  explicit_auth_flows = [
    "ALLOW_ADMIN_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_CUSTOM_AUTH"
  ]
  prevent_user_existence_errors = "ENABLED"
}
