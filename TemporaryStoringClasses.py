import pandas as pd


class SelectedEntitiesClass():
    """Manages a collection of selected entities.

        This class provides methods to set, retrieve, and manage a list of selected entities.
        It can be used in applications where specific entities need to be chosen from a larger set.

        Attributes:
            selectedEntities (list): The list of currently selected entities.
    """

    def __init__(self):
        """Initializes an empty list of selected entities."""
        self.selectedEntities = []

    def setSelectedEntities(self, entities):
        """Sets the list of selected entities.

                Args:
                    entities (list): The list of entities to set as selected.

                Raises:
                    TypeError: If `entities` is not a list.
        """
        self.selectedEntities = entities

    def getSelectedEntities(self):
        """Returns the list of currently selected entities.

                Returns:
                    list: The list of currently selected entities.

                Raises:
                    IndexError: If the list is empty and indexing is attempted.
        """
        return self.selectedEntities


class SetGetSelectedEntities():
    def __init__(self):
        self.selected = SelectedEntitiesClass()

    def set_(self, entities):
        self.selected.setSelectedEntities(entities)

    def get_(self):
        return self.selected.getSelectedEntities()


class SetGetAWSDetails():
    def __init__(self):
        self.bucket_name = ''
        self.access_key = ''
        self.secret_key = ''

    def set_bucket_name(self, name):
        self.bucket_name = name

    def set_access_key(self, access_key):
        self.access_key = access_key

    def set_secret_key(self, secret_key):
        self.secret_key = secret_key

    def get_(self):
        details = {
            "bucket_name": self.bucket_name,
            "access_key": self.access_key,
            "secret_key": self.secret_key
        }
        return details


class SetGetAzureDetails():
    def __init__(self):
        self.account_name = ''
        self.account_key = ''
        self.container = ''

    def set_account_name(self, account_name):
        self.account_name = account_name

    def set_account_key(self, account_key):
        self.account_key = account_key

    def set_container(self, container):
        self.container = container

    def get_(self):
        details = {
            "account_name": self.account_name,
            "account_key": self.account_key,
            "container": self.container
        }
        return details


class SetGetDataFrame:
    def __init__(self):
        self.df = pd.DataFrame()

    def set_dataframe(self, df):
        self.df = df

    def get_dataframe(self):
        if self.df.empty:
            return "Empty Dataframe"
        else:
            return self.df


class StreamableFiles:
    def __init__(self):
        self.smaller_files = []

    def add_streamable_files(self, files):
        self.smaller_files = files

    def get_streamable_files(self):
        return self.smaller_files


class SetGetStreamedDataFrame:
    def __init__(self):
        self.df = pd.DataFrame()

    def set_stream_dataframe(self, df):
        self.df = df

    def get_stream_dataframe(self):
        return self.df


class NeededInformation:
    def __init__(self):
        self.needed_information = ''

    def set_needed_information(self, information):
        self.needed_information = information

    def get_needed_information(self):
        return self.needed_information


class CloudFiles:
    def __init__(self):
        self.files = []

    def set_files(self, cloud_files):
        self.files = cloud_files

    def get_files(self):
        return self.files


class QAData:
    def __init__(self):
        self.content = ''

    def set_content(self, content):
        self.content = content

    def get_content(self):
        return self.content


class ChatHistory():

    def __init__(self):
        self.query = ''
        self.response = ''

    def store_chat_history(self, query, response):
        self.query = query
        self.response = response

    def return_chat_history(self):
        return [(self.query, self.response)]


class VectorDB():

    def __init__(self):
        self.db = ''

    def set_db(self, db):
        self.db = db

    def get_db(self):
        return self.db
