# Next

## Project structure

Split project files by feature or route
> This strategy stores globally shared application code in the `components` directory and splits more specific
> application code into the route segments that use them. (Source: Next.js)

```text
├── src
    ├── app
    │   └── view                        <- Route segment
    │       ├── [id]
    │       │   └── page.tsx
    │       │
    │       └── _containers             <- Containers are group of components that are used in a specific route segment
    │           ├── episode-section
    │           │   ├── _components     <- Subcomponents
    │           │   ├── _lib            <- Hooks, utils… of a particular container
    │           │   └── index.tsx
    │           └── meta-section
    │               └── ...
    ├── components
    │   ├── application                 <- Global components that persist throughout all views
    │   ├── shared                      <- Specialized components that can be re-used
    │   └── ui                          <- Primitive UI components
```
