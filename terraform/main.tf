terraform {
  required_version = "~> 1.14.3"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}


# This operation requires the handler to have been built before
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/../dist/index.mjs"
  output_path = "${path.module}/../dist/lambda.zip"
}

resource "aws_lambda_function" "proxy_lambda" {
  function_name = "transparent-proxy-func"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "index.handler" # File is index.js, export is handler
  runtime       = "nodejs24.x"
  architectures  = ["arm64"]
  
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  
  timeout     = 29
  memory_size = 128

  dead_letter_config {
    target_arn = aws_sqs_queue.lambda_dlq.arn
  }
  
  environment {
    variables = {
      TARGET_URL = var.target_url
    }
  }

  tags = {
    Name      = "transparent-proxy-func"
    Project   = "aws-proxy"
    ManagedBy = "Terraform"
  }
}

resource "aws_iam_role" "lambda_exec" {
  name = "proxy_lambda_exec_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = {
    Name      = "proxy-lambda-exec-role"
    Project   = "aws-proxy"
    ManagedBy = "Terraform"
  }
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_sqs_queue" "lambda_dlq" {
  name = "proxy-lambda-dlq"

  tags = {
    Name      = "proxy-lambda-dlq"
    Project   = "aws-proxy"
    ManagedBy = "Terraform"
  }
}

resource "aws_iam_role_policy" "lambda_dlq_policy" {
  name = "lambda-dlq-send-message-policy"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.lambda_dlq.arn
      }
    ]
  })
}

resource "aws_apigatewayv2_api" "http_api" {
  name          = "transparent-proxy-api"
  protocol_type = "HTTP"

  cors_configuration {
      allow_origins = ["*"] # Allows requests from any origin
      allow_methods = ["*"] # Allows all HTTP methods
      allow_headers = ["*"] # Allows all headers
  }  

  tags = {
    Name      = "transparent-proxy-api"
    Project   = "aws-proxy"
    ManagedBy = "Terraform"
  }
}

resource "aws_apigatewayv2_integration" "proxy_integration" {
  api_id           = aws_apigatewayv2_api.http_api.id
  integration_type = "AWS_PROXY"
  
  integration_uri    = aws_lambda_function.proxy_lambda.invoke_arn
  integration_method = "POST" 
  payload_format_version = "2.0"
}

# Route (Catch-all /{proxy+})
resource "aws_apigatewayv2_route" "proxy_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "ANY /{proxy+}" # Catch all methods and paths
  target    = "integrations/${aws_apigatewayv2_integration.proxy_integration.id}"
}

# Default Stage (Auto-deploy)
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true

  tags = {
    Name      = "transparent-proxy-default-stage"
    Project   = "aws-proxy"
    ManagedBy = "Terraform"
  }
}

# Permission (Allow API Gateway to invoke Lambda)
resource "aws_lambda_permission" "apigw_invoke" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.proxy_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}