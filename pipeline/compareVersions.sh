#!/bin/bash

get_json_value() {
    local json_url=$1
    local field_name=$2

    # Fetch JSON data from the URL
    # shellcheck disable=SC2155
    local json_data=$(curl -s "$json_url")

    # Check if curl was successful
    # shellcheck disable=SC2181
    if [ $? -ne 0 ]; then
        echo "Error fetching JSON data from $json_url"
        return 1
    fi

    # Extract the value for the given field name using jq
    # shellcheck disable=SC2155
    local value=$(echo "$json_data" | jq -r --arg field "$field_name" '.[$field]')

    # Check if jq was successful
    # shellcheck disable=SC2181
    if [ $? -ne 0 ]; then
        echo "Error parsing JSON data"
        return 1
    fi

    # Print the value
    echo "$value"
}

fail(){
    echo "Error: $1"
    exit 1
}

pass () {
    echo "✅ Success: $1"
    exit 0
}

# Function to compare two versions
compare_versions() {
  # Check if exactly two arguments are passed
  if [ "$#" -ne 2 ]; then
      fail "Exactly two arguments are required."
  fi

  # Check if versions match the pattern v[0-9].[0-9].[0-9]
  if ! [[ $1 =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]] || ! [[ $2 =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
      fail "Versions should match the pattern v[0-9].[0-9].[0-9]"
  fi

    # shellcheck disable=SC2053
    if [[ $1 == $2 ]]
    then
        fail "$1 is equal to $2"
    fi

    local IFS=.
    read -ra ver1 <<< "${1#v}"
    read -ra ver2 <<< "${2#v}"

    for ((i=0; i<${#ver1[@]}; i++))
    do
        if [[ ${ver1[i]} -gt ${ver2[i]} ]]
        then
            pass "$1 is greater than $2"
        elif [[ ${ver1[i]} -lt ${ver2[i]} ]]
        then
            fail "$1 is less than $2"
        fi
    done

    fail "$1 is equal to $2"
}

CURRENT_VERSION=$(get_json_value "$2" "branch")

# Compare the versions
compare_versions "$1" "$CURRENT_VERSION"
