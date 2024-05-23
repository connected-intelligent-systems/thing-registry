# Thing Registry

The Thing Registry is responsible for managing W3C Thing Descriptions. It provides functionality to create, update, and retrieve descriptions, which define the capabilities and properties of connected things. With the Thing Registry, users can easily store and access information about their connected things, enabling seamless integration and interoperability within the ecosystem.

In addition to managing Thing Descriptions, the Thing Registry also supports querying and searching for things and their capabilities. Users can perform queries to find specific things based on criteria such as name, type, or location. They can also search for capabilities that match certain requirements, allowing them to discover things that meet their specific needs.

The querying and searching capabilities of the Thing Registry enhance its usefulness and enable users to efficiently find and interact with the connected things in their environment.

## External Service Dependencies

The Thing Registry relies on the following external services:

* PostgreSQL: The PostgreSQL database is used for storing and managing the Thing Descriptions.
* Redis (optional): Redis is an optional dependency that can be used for caching and improving performance.
* Fuseki (optional): Fuseki is another optional dependency that can be used as a triple store for storing and querying RDF data.

## Documentation

The Thing Registry provides comprehensive documentation in the form of an OpenAPI specification. This specification, available in the `api-doc.yml` file, describes the RESTful API endpoints, request/response formats, and example payloads.

Developers can refer to this documentation to understand how to interact with the Thing Registry and integrate it into their applications. The OpenAPI specification provides a clear and standardized way to communicate the capabilities and usage of the API.

To get started, please refer to the `api-doc.yml` file for detailed information on the available endpoints and example usage.

## Run

### Docker Compose

To run the Thing Registry, you can use Docker Compose to start a preconfigured working environment. The Docker Compose file, `docker-compose.yml`, includes the necessary configuration to set up the required services, such as PostgreSQL, Redis (optional), and Fuseki (optional).

By running the following command in the terminal: ```docker-compose up```, you can start the Thing Registry.

### Image

```shell
docker run -it --rm --name thing-registry \
-e DATABASE_URL='postgresql://postgres:5432/thing-registry' \
registry.fsn.iotx.materna.work/registry/public/thing-registry:latest
```

## Environment Variables

The Thing Registry can be configured using the following environment variables:

* `PORT`: The port on which the Thing Registry will listen for incoming requests. Default value is `8080`.
* `BASE_PATH`: The base path for the Thing Registry API. Default value is `/api/registry`.
* `DATABASE_URL`: The URL of the PostgreSQL database. This variable is required for the Thing Registry to connect to the database.
* `REDIS_URL` (optional): The URL of the Redis server. This variable is optional and can be used for caching and improving performance.
* `FUSEKI_URL` (optional): The URL of the Fuseki server. This variable is optional and can be used as a triple store for storing and querying RDF data.

## Authors

Sebastian Alberternst <sebastian.alberternst@dfki.de>

## License

MIT 