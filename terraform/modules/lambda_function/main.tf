terraform {
  required_version = "~> 1.14.3"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.7"
    }
  }
}

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = var.source_file
  output_path = var.output_path
}

resource "aws_lambda_function" "this" {
  function_name = var.function_name
  role          = aws_iam_role.lambda_exec.arn
  handler       = var.handler
  runtime       = "nodejs24.x"
  architectures = ["arm64"]

  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  timeout     = var.timeout
  memory_size = var.memory_size

  dynamic "dead_letter_config" {
    for_each = var.dlq_target_arn != null ? [1] : []
    content {
      target_arn = var.dlq_target_arn
    }
  }

  environment {
    variables = var.environment_variables
  }

  tags = {
    Name      = var.function_name
    Project   = "aws-proxy"
    ManagedBy = "Terraform"
  }
}

resource "aws_iam_role" "lambda_exec" {
  name = "${var.function_name}_exec_role"

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
    Name      = "${var.function_name}-exec-role"
    Project   = "aws-proxy"
    ManagedBy = "Terraform"
  }
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "additional_policy" {
  count = var.additional_policy != null ? 1 : 0
  name  = "${var.function_name}-additional-policy"
  role  = aws_iam_role.lambda_exec.id
  policy = var.additional_policy
}
