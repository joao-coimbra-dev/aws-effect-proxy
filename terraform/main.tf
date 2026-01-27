terraform {
  required_version = "~> 1.14.3"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# --------------------------------------------------------------------------------
# Modules Instantiation
# --------------------------------------------------------------------------------

module "users_table" {
  source     = "./modules/dynamodb_table"
  table_name = var.dynamodb_table_name
  hash_key   = "id"
}

module "proxy_lambda" {
  source        = "./modules/lambda_function"
  function_name = "transparent-proxy-func"
  handler       = "index.handler"
  source_file   = "${path.module}/../dist/index.mjs"
  output_path   = "${path.module}/../dist/lambda.zip"
  timeout       = 29
  environment_variables = {
    TARGET_URL = var.target_url
  }
  # dlq_target_arn = module.proxy_dlq.arn # We'll create a DLQ module later if needed
}

module "users_lambda" {
  source        = "./modules/lambda_function"
  function_name = "users-crud-func"
  handler       = "users-handler.handler"
  source_file   = "${path.module}/../dist/users-handler.mjs"
  output_path   = "${path.module}/../dist/users-lambda.zip"
  environment_variables = {
    USERS_TABLE_NAME = module.users_table.name
  }
  additional_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Scan"
        ]
        Resource = module.users_table.arn
      }
    ]
  })
}

module "api_gateway" {
  source   = "./modules/api_gateway"
  api_name = "transparent-proxy-api"
  integrations = {
    "proxy" = {
      lambda_invoke_arn    = module.proxy_lambda.invoke_arn
      lambda_function_name = module.proxy_lambda.function_name
    }
    "users" = {
      lambda_invoke_arn    = module.users_lambda.invoke_arn
      lambda_function_name = module.users_lambda.function_name
    }
    "auth" = {
      lambda_invoke_arn    = module.auth_lambda.invoke_arn
      lambda_function_name = module.auth_lambda.function_name
    }
  }
  routes = {
    "POST /users"        = "users"
    "GET /users"         = "users"
    "GET /users/{id}"    = "users"
    "PUT /users/{id}"    = "users"
    "DELETE /users/{id}" = "users"
    "POST /signup"       = "auth"
    "POST /confirm"      = "auth"
    "ANY /{proxy+}"      = "proxy"
  }
}

module "cognito_user_pool" {
  source                      = "./modules/cognito_user_pool"
  user_pool_name              = var.cognito_user_pool_name
  client_name                 = var.cognito_client_name
  define_auth_challenge_arn   = module.define_auth_challenge_lambda.arn
  create_auth_challenge_arn   = module.create_auth_challenge_lambda.arn
  verify_auth_challenge_arn   = module.verify_auth_challenge_lambda.arn
}

module "auth_lambda" {
  source        = "./modules/lambda_function"
  function_name = "auth-func"
  handler       = "auth-handler.handler"
  source_file   = "${path.module}/../dist/auth-handler.mjs"
  output_path   = "${path.module}/../dist/auth-lambda.zip"
  environment_variables = {
    COGNITO_USER_POOL_ID = module.cognito_user_pool.user_pool_id
    COGNITO_CLIENT_ID    = module.cognito_user_pool.client_id
  }
  additional_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:SignUp",
          "cognito-idp:ConfirmSignUp",
          "cognito-idp:AdminInitiateAuth"
        ]
        Resource = module.cognito_user_pool.user_pool_arn
      }
    ]
  })
}

# --------------------------------------------------------------------------------
# Cognito Trigger Lambdas
# --------------------------------------------------------------------------------

module "define_auth_challenge_lambda" {
  source        = "./modules/lambda_function"
  function_name = "define-auth-challenge-func"
  handler       = "define.handler"
  source_file   = "${path.module}/../dist/define.mjs"
  output_path   = "${path.module}/../dist/define.zip"
}

module "create_auth_challenge_lambda" {
  source        = "./modules/lambda_function"
  function_name = "create-auth-challenge-func"
  handler       = "create.handler"
  source_file   = "${path.module}/../dist/create.mjs"
  output_path   = "${path.module}/../dist/create.zip"
}

module "verify_auth_challenge_lambda" {
  source        = "./modules/lambda_function"
  function_name = "verify-auth-challenge-func"
  handler       = "verify.handler"
  source_file   = "${path.module}/../dist/verify.mjs"
  output_path   = "${path.module}/../dist/verify.zip"
}

# --------------------------------------------------------------------------------
# Cognito Trigger Permissions
# --------------------------------------------------------------------------------

resource "aws_lambda_permission" "define_auth_challenge" {
  action        = "lambda:InvokeFunction"
  function_name = module.define_auth_challenge_lambda.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = module.cognito_user_pool.user_pool_arn
}

resource "aws_lambda_permission" "create_auth_challenge" {
  action        = "lambda:InvokeFunction"
  function_name = module.create_auth_challenge_lambda.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = module.cognito_user_pool.user_pool_arn
}

resource "aws_lambda_permission" "verify_auth_challenge" {
  action        = "lambda:InvokeFunction"
  function_name = module.verify_auth_challenge_lambda.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = module.cognito_user_pool.user_pool_arn
}
