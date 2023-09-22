#!/bin/bash
NC='\033[0m' # No Color

function api-specifications() {
  local project="api-specifications"
  printTitle ${project}
  (cd api-specifications/ && yarn && yarn run lint && yarn run format && yarn run compile && yarn run test)
  # if the previous command fails, exit this script with a non-zero error code
  if [ $? -ne 0 ]; then
    printError ${project}
    exit 1
  fi
  printSuccess ${project}
}
function frontend() {
  local project="frontend"
    printTitle ${project}
  (cd frontend/ && yarn && yarn run lint && yarn run format && yarn run compile && yarn run test && yarn build-storybook && yarn test:accessibility)
  # if the previous command fails, exit this script with a non-zero error code
  if [ $? -ne 0 ]; then
    printError ${project}
    exit 1
  fi
  printSuccess ${project}
}

function backend() {
  local project="backend"
    printTitle ${project}
  (cd backend/ && yarn && yarn run lint && yarn run format && yarn run compile && yarn run test && yarn run generate:openapi && yarn run generate:swagger && yarn run generate:redoc)
  # if the previous command fails, exit this script with a non-zero error code
  if [ $? -ne 0 ]; then
    printError ${project}
    exit 1
  fi
  printSuccess ${project}
}

function printTitle() {
  local blue='\033[1;30;44m'
  local title="Begin to build the ${1}"
  printf "${blue}$(getSpaces "${title}")${NC}\n"
  printf "${blue}${title}${NC}\n"
  printf "${blue}$(getSpaces "${title}")${NC}\n"
}
function getSpaces() {
  local length=${#1}
  echo "%${length}s"
}

function printSuccess() {
  local green='\033[1;32;42m'
  local txt="Building the ${1} succeeded!"
  printf "${green}$(getSpaces "${txt}")${NC}\n"
  printf "${green}${txt}${NC}\n"
  printf "${green}$(getSpaces "${txt}")${NC}\n"
}
function printError() {
  local red='\033[1;31;41m'
  local txt="Building the ${1} failed!"
  printf "${red}$(getSpaces "${txt}")${NC}\n"
  printf "${red}${txt}${NC}\n"
  printf "${red}$(getSpaces "${txt}")${NC}\n"
}

PS3="Select what you want to build and test: "

OPTIONS="All Api-Specifications Frontend Backend"
select opt in $OPTIONS; do
  if [ "$REPLY" = "1" ]; then
      echo "******************" &&
      echo "Building all" &&
      echo "******************" &&
      api-specifications && frontend && backend
      exit $?
  elif [ "$REPLY" = "2" ]; then
    api-specifications
    exit $?
  elif [ "$REPLY" = "3" ]; then
   frontend
   exit $?
  elif [ "$REPLY" = "4" ]; then
    backend
    exit $?
  else
    clear
    echo bad option
  fi
done