# Makefile for Spresense Gemini Analyzer

# Variables
PYTHON := python3
PIP := pip3
VENV_DIR := venv
REQUIREMENTS := requirements-dev.txt

# Set up virtual environment and install dependencies
.PHONY: setup
setup:
	@echo "Setting up Python virtual environment..."
	$(PYTHON) -m venv $(VENV_DIR)
	@echo "Installing dependencies..."
	@if [ -f "$(VENV_DIR)/bin/activate" ]; then \
		. $(VENV_DIR)/bin/activate && $(PIP) install -r $(REQUIREMENTS); \
	else \
		$(VENV_DIR)\Scripts\activate && $(PIP) install -r $(REQUIREMENTS); \
	fi
	@echo "Setup complete!"