---
title: "Handling Inconsistent JSON Data with Custom Types in Go"
description: "Learn how to effectively handle inconsistencies in JSON data by using custom types in Go. This article provides step-by-step guidance and code examples to help you unmarshal and marshal JSON data with varying data types for specific fields."
created_at: 2023-06-06
published_at: 2023-06-06
---

In Go, there are times we encounter situations where we need to read JSON data produced by external sources. However, inconsistencies in the data can pose challenges, particularly when the expected field types differ. In this article, I would like to document how I solve the situation I encounter in work by using custom types to handle such JSON inconsistencies.

These examples illustrate the inconsistency we might face when receiving JSON data from a third-party API. The "id" field should ideally be an array of numbers, but it can be returned as a string, a number, or even a string with comma-separated values:

```json
// Inconsistent values of the "id" field received from a third-party API

// id returned as a string
{
    "data": {
        "id": "11"
    }
}

// id returned as a number
{
    "data": {
        "id": 11
    }
}

// id returned as comma-separated values in a string
{
    "data": {
        "id": "1,2,3"
    }
}
```

Due to Go's static typing nature, it expects consistent JSON types. The inconsistencies mentioned above can cause error when trying to unmarshal the JSON into a struct.

Consider following example:
```go
type Resp struct {
    Data `json:"data"`
}

type Data struct {
    ID string `json:"id"`
}

func main() {
    r := Resp{}

    // Success case
    receivedJSON := `{
        "data": {
            "id": "123"
        }
    }`

    if err := json.Unmarshal([]byte(receivedJSON), &r); err != nil {
		fmt.Println(err.Error())
		return
	}

    fmt.Println(r.Data.ID) // Output: 123
}
```

In the above example, the program successfully marshal the required json since value for `id` is passed as a string. However, the inconsistency from third party API might cause cause an error as in following example:

```go

func main() {
    r := Resp{}
    // Error case: Number
    inconsistentJSON := `{
        "data": {
            "id": 234
        }
    }`
    if err := json.Unmarshal(inconsistentJSON, &r); err != nil {
		fmt.Println(err.Error()) 
		return
	}
    fmt.Println(r.Data.ID)
}
```
Output 
```
json: cannot unmarshal number into Go struct field Data.data.id of type string
```

To solve this problem, we can create a custom type and define methods to handle the unmarshaling and marshaling processes for that type. Let's take a closer look at the implementation:

```go
type CustomIDs struct {
	Val []int
}

// UnmarshalJSON will be executed if json.Unmarshal() is called during unmarshaling to a struct which contain CustomIDs type
func (l *CustomIDs) UnmarshalJSON(data []byte) (err error) {
	str := string(data)

	if strings.Contains(str, `"`) {
		str, err = strconv.Unquote(str)
		if err != nil {
			return err
		}
	}

	slice := strings.Split(str, ",")
    // Assign a default value
	if len(slice) == 0 {
		*l = CustomIDs{[]int{}}
		return nil
	}
	if len(slice) == 1 && slice[0] == "" {
		*l = CustomIDs{[]int{}}
		return nil
	}

	var ids []int
	for _, v := range slice {
		id, err := strconv.Atoi(v)
		if err != nil {
			return err
		}
		ids = append(ids, id)
	}

	*l = CustomIDs{ids}
	return nil
}

// MarshalJSON will be executed if json.Marshal() is called during marshal from a struct which contain CustomIDs type
func (c CustomIDs) MarshalJSON() (data []byte, err error) {
	if c.Val == nil {
		return json.Marshal("")
	}

	if len(c.Val) == 0 {
		return json.Marshal("")
	}

	var s []string
	for _, id := range c.Val {
		s = append(s, strconv.Itoa(id))
	}

	ret := strings.Join(s, ",")
	return json.Marshal(ret)
}
```
The CustomIDs type can now handle `"id"` values such as `"10"`, `10`, or `"10,20,30"`, ensuring flexibility for different scenarios.

In conclusion, by implementing custom types and their associated methods, we can effectively handle JSON inconsistencies in Go. This approach allows us to seamlessly unmarshal and marshal JSON data with varying field types, providing more robust and reliable data processing capabilities in our applications.